#!/usr/bin/env python
import os
os.environ['FLASK_APP'] = 'superset.app'

from superset.app import create_app

app = create_app()

with app.app_context():
    try:
        from superset import db
        from flask_migrate import upgrade
        
        print('Upgrading database...')
        upgrade()
        print('Database upgrade completed successfully')
        
    except Exception as e:
        print(f'Error: {str(e)}')
        import traceback
        traceback.print_exc()
