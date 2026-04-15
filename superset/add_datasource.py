"""
Runs inside the Superset container after init.
Registers the EBP PostgreSQL database and creates
all charts + the EBP Analytics dashboard via REST API.
"""
import requests
import json
import time

BASE = "http://localhost:8088"
SESSION = requests.Session()

def login():
    r = SESSION.post(f"{BASE}/api/v1/security/login", json={
        "username": "admin", "password": "admin123",
        "provider": "db", "refresh": True
    })
    token = r.json()["access_token"]
    SESSION.headers.update({"Authorization": f"Bearer {token}"})
    # CSRF
    csrf = SESSION.get(f"{BASE}/api/v1/security/csrf_token/").json()["result"]
    SESSION.headers.update({"X-CSRFToken": csrf, "Referer": BASE})
    print("  Logged in to Superset API")

def add_database():
    payload = {
        "database_name": "EBP PostgreSQL",
        "sqlalchemy_uri": "postgresql+psycopg2://ebpuser:ebppass@ebp-postgres:5432/ebpdb",
        "expose_in_sqllab": True,
        "allow_run_async": True,
        "allow_ctas": False,
        "allow_cvas": False,
        "allow_dml": False,
    }
    r = SESSION.post(f"{BASE}/api/v1/database/", json=payload)
    if r.status_code in (200, 201):
        db_id = r.json()["id"]
        print(f"  Database registered (id={db_id})")
        return db_id
    # Already exists — fetch it
    r2 = SESSION.get(f"{BASE}/api/v1/database/?q=(filters:!((col:database_name,opr:eq,val:'EBP PostgreSQL')))")
    db_id = r2.json()["result"][0]["id"]
    print(f"  Database already exists (id={db_id})")
    return db_id

def add_dataset(db_id, table_name, schema="public"):
    payload = {"database": db_id, "schema": schema, "table_name": table_name}
    r = SESSION.post(f"{BASE}/api/v1/dataset/", json=payload)
    if r.status_code in (200, 201):
        ds_id = r.json()["id"]
        print(f"  Dataset '{table_name}' created (id={ds_id})")
        return ds_id
    # Already exists
    r2 = SESSION.get(f"{BASE}/api/v1/dataset/?q=(filters:!((col:table_name,opr:eq,val:'{table_name}')))")
    results = r2.json().get("result", [])
    if results:
        ds_id = results[0]["id"]
        print(f"  Dataset '{table_name}' already exists (id={ds_id})")
        return ds_id
    return None

def add_chart(name, viz_type, datasource_id, datasource_type, params):
    payload = {
        "slice_name": name,
        "viz_type": viz_type,
        "datasource_id": datasource_id,
        "datasource_type": datasource_type,
        "params": json.dumps(params),
    }
    r = SESSION.post(f"{BASE}/api/v1/chart/", json=payload)
    if r.status_code in (200, 201):
        chart_id = r.json()["id"]
        print(f"  Chart '{name}' created (id={chart_id})")
        return chart_id
    print(f"  Chart '{name}' failed: {r.text[:120]}")
    return None

def add_dashboard(title, chart_ids):
    # Build simple grid layout
    positions = {"DASHBOARD_VERSION_KEY": "v2"}
    row_id = "GRID_ID"
    positions[row_id] = {"children": [], "id": row_id, "type": "GRID"}
    for i, cid in enumerate(chart_ids):
        if cid is None:
            continue
        comp_id = f"CHART-{cid}"
        positions[comp_id] = {
            "children": [], "id": comp_id, "type": "CHART",
            "meta": {"chartId": cid, "width": 6, "height": 50},
        }
        positions[row_id]["children"].append(comp_id)

    payload = {
        "dashboard_title": title,
        "published": True,
        "position_json": json.dumps(positions),
    }
    r = SESSION.post(f"{BASE}/api/v1/dashboard/", json=payload)
    if r.status_code in (200, 201):
        dash_id = r.json()["id"]
        print(f"  Dashboard '{title}' created (id={dash_id})")
        return dash_id
    print(f"  Dashboard failed: {r.text[:120]}")
    return None

def enable_embedding(dashboard_id):
    r = SESSION.post(f"{BASE}/api/v1/dashboard/{dashboard_id}/embedded",
                     json={"allowed_domains": ["localhost"]})
    if r.status_code in (200, 201):
        uuid = r.json().get("result", {}).get("uuid", "")
        print(f"  Embedding enabled, UUID={uuid}")
        return uuid
    print(f"  Embedding setup: {r.text[:120]}")
    return None

# ── Main ──────────────────────────────────────────────────────────────────────
time.sleep(5)   # give gunicorn a moment
login()

db_id = add_database()

# Register all tables as datasets
ds_leave      = add_dataset(db_id, "employee_leave")
ds_half       = add_dataset(db_id, "employee_half_day_leave")
ds_employee   = add_dataset(db_id, "employee")
ds_location   = add_dataset(db_id, "location")
ds_holiday    = add_dataset(db_id, "location_holiday")
ds_schedule   = add_dataset(db_id, "store_secondary_schedule")

chart_ids = []

# 1. Leave type breakdown — pie chart
c1 = add_chart("Leave Type Breakdown", "pie", ds_leave, "table", {
    "groupby": ["leave_type"],
    "metric": {"aggregate": "COUNT", "column": {"column_name": "id"}, "expressionType": "SIMPLE", "label": "Count"},
    "color_scheme": "supersetColors",
    "show_labels": True,
    "show_legend": True,
})
chart_ids.append(c1)

# 2. Monthly leave trend — line chart
c2 = add_chart("Monthly Leave Trend", "echarts_timeseries_line", ds_leave, "table", {
    "x_axis": "leave_date",
    "metrics": [{"aggregate": "COUNT", "column": {"column_name": "id"}, "expressionType": "SIMPLE", "label": "Leaves"}],
    "groupby": [],
    "time_grain_sqla": "P1M",
    "color_scheme": "supersetColors",
    "show_legend": True,
})
chart_ids.append(c2)

# 3. Leaves per store — bar chart
c3 = add_chart("Leaves per Store", "echarts_bar", ds_leave, "table", {
    "metrics": [{"aggregate": "COUNT", "column": {"column_name": "id"}, "expressionType": "SIMPLE", "label": "Total Leaves"}],
    "groupby": [],
    "columns": [],
    "color_scheme": "supersetColors",
    "show_legend": False,
})
chart_ids.append(c3)

# 4. Leave status distribution — bar chart
c4 = add_chart("Leave Status Distribution", "echarts_bar", ds_leave, "table", {
    "metrics": [{"aggregate": "COUNT", "column": {"column_name": "id"}, "expressionType": "SIMPLE", "label": "Count"}],
    "groupby": ["status"],
    "color_scheme": "supersetColors",
    "show_legend": True,
})
chart_ids.append(c4)

# 5. Employees per location — bar chart
c5 = add_chart("Employees per Location", "echarts_bar", ds_employee, "table", {
    "metrics": [{"aggregate": "COUNT", "column": {"column_name": "id"}, "expressionType": "SIMPLE", "label": "Employees"}],
    "groupby": ["location_id"],
    "color_scheme": "supersetColors",
    "show_legend": False,
})
chart_ids.append(c5)

# 6. Half-day leave type breakdown — pie
c6 = add_chart("Half-Day Leave Types", "pie", ds_half, "table", {
    "groupby": ["leave_type"],
    "metric": {"aggregate": "COUNT", "column": {"column_name": "id"}, "expressionType": "SIMPLE", "label": "Count"},
    "color_scheme": "supersetColors",
    "show_labels": True,
})
chart_ids.append(c6)

# 7. Holidays per region — big number
c7 = add_chart("Total Holidays Tracked", "big_number_total", ds_holiday, "table", {
    "metric": {"aggregate": "COUNT", "column": {"column_name": "id"}, "expressionType": "SIMPLE", "label": "Holidays"},
    "subheader": "Across all UK stores",
})
chart_ids.append(c7)

# 8. Leave heatmap by day of week — heatmap
c8 = add_chart("Leave Heatmap (Day of Week)", "cal_heatmap", ds_leave, "table", {
    "metrics": [{"aggregate": "COUNT", "column": {"column_name": "id"}, "expressionType": "SIMPLE", "label": "Leaves"}],
    "time_grain_sqla": "P1D",
    "domain_granularity": "month",
    "subdomain_granularity": "day",
})
chart_ids.append(c8)

# Create dashboard with all charts
valid_ids = [c for c in chart_ids if c is not None]
dash_id = add_dashboard("EBP Analytics Dashboard", valid_ids)

if dash_id:
    uuid = enable_embedding(dash_id)
    # Write UUID to a file so React can read it
    with open("/app/superset/dashboard_uuid.txt", "w") as f:
        f.write(str(uuid) if uuid else str(dash_id))
    print(f"\n✅ Setup complete. Dashboard ID: {dash_id}")
else:
    print("\n⚠️  Dashboard creation failed — check Superset logs")
