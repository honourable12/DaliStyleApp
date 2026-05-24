FROM floci/floci:latest

# Copy initialization script to the directory LocalStack/Floci monitors
COPY init.sh /etc/localstack/init/ready.d/init.sh

# Ensure it's executable
RUN chmod +x /etc/localstack/init/ready.d/init.sh

EXPOSE 4566
