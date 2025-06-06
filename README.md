# WhatsApp Bulk Messenger

A professional TypeScript-based application for sending bulk WhatsApp messages using Excel templates.

## Features

- **User-friendly Web Interface**: Easy-to-use browser-based interface
- **Message Types**: Send text messages, documents, and media with captions
- **Excel Integration**: Upload an Excel file with message details
- **Status Tracking**: Monitor message delivery status in real-time
- **Session Persistence**: No need to scan WhatsApp QR code repeatedly
- **Customizable Settings**: Configure delays and retry settings
- **Comprehensive Reporting**: Get detailed statistics on message delivery

## Installation

### Prerequisites

- Node.js (v14+)
- npm (v6+)
- TypeScript (installed globally or as a dev dependency)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/whatsapp-bulk-messenger.git
   cd whatsapp-bulk-messenger
   ```

2. **Run the setup script**
   
   On Windows:
   ```bash
   install.bat
   ```
   
   On MacOS/Linux:
   ```bash
   npm install
   npm run build
   ```

3. **Start the application**
   
   On Windows:
   ```bash
   start.bat
   ```
   
   On MacOS/Linux:
   ```bash
   npm start
   ```
   
   The application will open at http://localhost:3000

## Using WhatsApp Bulk Messenger

### Step 1: Connect WhatsApp

1. Go to the "Connection" tab
2. Enter your WhatsApp phone number (with country code) and click "Save Sender Details"
3. Click "Connect WhatsApp"
4. Scan the QR code with your WhatsApp mobile app
5. Wait for the connection to be established

### Step 2: Prepare Excel Template

Create an Excel file with the following columns:

| Number | Type | Message/Caption | Link |
|--------|------|----------------|------|
| Phone number | message, document, or media | Text message or caption | File path for document/media |

- **Number**: Recipient's phone number (with or without country code)
- **Type**: Must be one of: "message", "document", or "media"
- **Message/Caption**: The text message or caption for media/documents
- **Link**: The file path for document/media (required for document/media types)

You can download an example template from the Excel Upload tab.

### Step 3: Upload Excel File

1. Go to the "Excel Upload" tab
2. Click "Choose Excel File" and select your prepared Excel file
3. Click "Upload Excel"
4. The application will validate your file and show any errors

### Step 4: Send Messages

1. Go to the "Send Messages" tab
2. Click "Start Messaging" to begin sending messages
3. Monitor the progress and message logs
4. You can stop the process at any time by clicking "Stop"

### Step 5: View Statistics

1. Go to the "Statistics" tab to view delivery statistics
2. You'll see a summary of sent, pending, and failed messages
3. Click "Refresh Statistics" to update the data

## Configuration

You can customize various settings in the "Settings" tab:

- **Delay Between Messages**: Time to wait between sending messages (1000-10000 ms)
- **Maximum Retries**: Number of retry attempts if message sending fails (0-5)
- **Retry Delay**: Time to wait before retry attempts (1000-30000 ms)

## Project Structure

```
whatsapp-bulk-messenger/
├── src/                     # TypeScript source code
│   ├── config/              # Configuration management
│   ├── services/            # Core services
│   ├── utils/               # Utility functions
│   ├── middleware/          # Express middleware
│   ├── routes/              # API routes
│   ├── types/               # TypeScript type definitions
│   ├── app.ts               # Express app setup
│   └── server.ts            # Main entry point
├── public/                  # Static frontend files
│   ├── css/                 # Stylesheets
│   ├── js/                  # Client-side JavaScript modules
│   └── images/              # Images and icons
├── views/                   # HTML templates
├── dist/                    # Compiled JavaScript output
├── uploads/                 # User uploaded files
├── data/                    # Application data storage
├── logs/                    # Log files
├── install.bat              # Windows installation script
├── start.bat                # Windows startup script
├── uninstall.bat            # Windows cleanup script
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## Troubleshooting

### If messages are not sending:

- Make sure your WhatsApp is properly connected
- Check that your Excel format is correct
- Verify that file paths for documents/media are correct and accessible
- Ensure phone numbers are in the correct format
- Try increasing the delay between messages in Settings

### If the application crashes:

- Restart the application
- Check the logs folder for error details
- Reduce the size of your Excel file if it's very large

## License

This software is proprietary and confidential."# whatsapp-bulk-ts" 
"# whatsapp-bulk-ts" 
