"""Test if the app can be imported without errors."""
import sys
import os

# Get script directory for output file
script_dir = os.path.dirname(os.path.abspath(__file__))
output_file = os.path.join(script_dir, 'import_result.txt')

try:
    from app.main import app
    result = "SUCCESS: Backend imports OK"
    print(result)
    with open(output_file, 'w') as f:
        f.write(result)
    sys.exit(0)
except Exception as e:
    import traceback
    error_msg = f"ERROR: {type(e).__name__}: {e}\n\n{traceback.format_exc()}"
    print(error_msg)
    with open(output_file, 'w') as f:
        f.write(error_msg)
    sys.exit(1)

