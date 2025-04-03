# Cron Job Implementation

This folder contains a cron job implementation that calls a specified endpoint at regular intervals.

## Features

- Calls a configurable endpoint every 10 minutes
- Configurable through environment variables
- Logs all calls and responses for monitoring

## Configuration

Set the following environment variable in your `.env` file:

```
CRON_ENDPOINT_URL=http://example.com/api/endpoint
```

## How It Works

The cron job is implemented using `node-cron` and automatically starts when the server starts. It runs every 10 minutes (at :00, :10, :20, :30, :40, and :50 minutes of each hour).

Each time it runs, it:

1. Makes a GET request to the configured endpoint
2. Logs the response or any errors
3. Continues running until the server is stopped

## Testing

You can test the cron job manually by:

1. Start the server: `npm run dev`
2. Wait for the scheduled time to see the logs
3. Or check the server logs for entries with timestamp and "Calling endpoint" message

## Error Handling

The cron job will:

- Log errors if the endpoint is not accessible
- Continue running even if there are errors with individual calls
- Exit with an error message if the endpoint URL is not configured
