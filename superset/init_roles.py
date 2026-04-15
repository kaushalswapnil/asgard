#!/usr/bin/env python
import os
os.environ['FLASK_APP'] = 'superset.app'

from superset.app import create_app

app = create_app()

with app.app_context():
    try:
        from flask_appbuilder.security.sqla.models import User, Role
        from superset import db
        
        print('Initializing roles and permissions...')
        
        # Get admin user
        admin_user = db.session.query(User).filter_by(username='admin').first()
        
        if admin_user:
            print(f'Found admin user: {admin_user.username}')
            
            # Get Admin role
            admin_role = db.session.query(Role).filter_by(name='Admin').first()
            
            if admin_role:
                print(f'Found Admin role')
                # Clear existing roles and assign Admin role
                admin_user.roles = [admin_role]
                db.session.commit()
                print(f'Assigned Admin role to admin user')
            else:
                print('Admin role not found')
        else:
            print('Admin user not found')
        
        # List all roles
        roles = db.session.query(Role).all()
        print(f'\nAvailable roles:')
        for role in roles:
            print(f'  - {role.name}')
        
        print('\nRoles and permissions initialized successfully')
        
    except Exception as e:
        print(f'Error: {str(e)}')
        import traceback
        traceback.print_exc()
