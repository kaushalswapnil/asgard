#!/usr/bin/env python
import os
os.environ['FLASK_APP'] = 'superset.app'

from superset.app import create_app
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    try:
        from flask_appbuilder.security.sqla.models import User, Role
        from superset import db
        
        user = db.session.query(User).filter_by(username='admin').first()
        
        if user:
            print('Admin user exists, resetting password...')
            user.password = generate_password_hash('admin123')
        else:
            print('Creating new admin user...')
            admin_role = db.session.query(Role).filter_by(name='Admin').first()
            user = User(
                username='admin',
                first_name='Admin',
                last_name='User',
                email='admin@example.com',
                active=True
            )
            user.password = generate_password_hash('admin123')
            if admin_role:
                user.roles = [admin_role]
            db.session.add(user)
        
        db.session.commit()
        print('SUCCESS: Admin user ready - username: admin, password: admin123')
        
    except Exception as e:
        print(f'ERROR: {str(e)}')
        import traceback
        traceback.print_exc()
