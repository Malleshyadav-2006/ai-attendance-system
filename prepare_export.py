import os
import time
import shutil

# Directories and files to exclude
EXCLUDE = {
    '__pycache__',
    'node_modules',
    '.next',
    '.git',
    '.env',
    'venv',
    'env',
    '.vercel',
    '.turbo',
    'temp_',
    'debug_',
    'verify_',
    'full_check.py',
    'simple_check.py',
    'check_libs.py'
}

def should_exclude(path):
    """Check if path should be excluded"""
    for exclude in EXCLUDE:
        if exclude in path:
            return True
    return False

def prepare_export():
    """Prepare project for export"""
    print("🚀 Preparing project for export...")
    
    # Create unique export directory to avoid locking issues
    export_dir = f"ignite_export_{int(time.time())}"
    os.makedirs(export_dir)
    
    # Copy project files
    print("📦 Copying project files...")
    for item in os.listdir('.'):
        if item == export_dir or should_exclude(item):
            continue
        
        src = item
        dst = os.path.join(export_dir, item)
        
        if os.path.isdir(src):
            shutil.copytree(src, dst, ignore=shutil.ignore_patterns(*EXCLUDE))
        else:
            shutil.copy2(src, dst)
    
    # Create .env.example files
    print("📝 Creating .env.example files...")
    
    backend_env_example = """# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_password
"""
    
    backend_dir = os.path.join(export_dir, 'backend')
    if not os.path.exists(backend_dir):
         os.makedirs(backend_dir)

    with open(os.path.join(backend_dir, '.env.example'), 'w') as f:
        f.write(backend_env_example)
    
    # Create README for export
    readme_content = """# AI Smart Attendance System

## Quick Start
# Edit .env with your Supabase credentials
python check_and_migrate.py
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Login: http://localhost:3000/admin/login

## Default Admin Credentials
- Username: `admin`
- Password: `admin123` (change in .env)

## Documentation
See `PROJECT_DOCUMENTATION.md` for complete guide.

## Deployment
See `DEPLOYMENT.md` for free hosting options.
"""
    
    with open(os.path.join(export_dir, 'README.md'), 'w') as f:
        f.write(readme_content)
    
    print(f"✅ Export complete! Check '{export_dir}' folder")
    print(f"\n📦 To share:")
    print(f"   1. Zip the '{export_dir}' folder")
    print(f"   2. Share the zip file")
    print(f"\n⚠️  Remember to:")
    print(f"   - Never share your .env file")
    print(f"   - Update credentials before deployment")

if __name__ == "__main__":
    prepare_export()
