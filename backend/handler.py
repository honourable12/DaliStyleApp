import os
from mangum import Mangum
from app.main import app

# This is for AWS Lambda integration
handler = Mangum(app, lifespan="off")

# In Lambda, we might want to trigger migrations on cold start or via a separate task
# For simple serverless setups, we can check if we need to run migrations here, 
# but it's better to do it in the CI/CD pipeline or via a dedicated migration task.
