📋 Example Usage
Input:
Tomorrow gym at 1pm
University class tomorrow 10am to 12pm
Team meeting on October 20 at 3pm
Result:

✅ 3 events automatically added to Google Calendar
✅ Confirmation email with event details
✅ All durations calculated correctly

🛠️ Tech Stack

Google Apps Script: Backend automation
Google Gemini 2.5 Flash: AI for natural language understanding
Google Forms: User interface
Google Calendar API: Calendar integration
Gmail API: Email notifications

🚀 Setup Instructions
Prerequisites

Google account
Gemini API key (Get one free here)

Installation

Create a Google Form

Go to Google Forms
Create a new form with one paragraph question: "Describe your day"


Set Up Apps Script

Open your form → Three dots menu → Script editor
Paste the code from calendar-agent.gs
Replace YOUR_GEMINI_API_KEY_HERE with your actual API key
Replace YOUR_GOOGLE_FORM_ID_HERE with your form ID (from the URL)


Run Setup

In the Apps Script editor, select setupFormTrigger from the function dropdown
Click Run and authorize the required permissions
You'll receive a confirmation email


Start Using

Fill out your form with your schedule
Submit and watch events appear in your calendar!



🎓 What I Learned
This was my first AI agent project, where I learned:

How to integrate AI APIs into automation workflows
Google Apps Script fundamentals
Event-driven programming with form triggers
Parsing and structuring AI responses
Error handling and user feedback loops

📝 Future Improvements

 Voice input support
 Recurring event detection
 Calendar conflict warnings
 Multi-calendar support
 Mobile app interface

📄 License
MIT License - feel free to use and modify!
🤝 Contributing
Suggestions and improvements are welcome! Feel free to open an issue or submit a pull request.

Built with ❤️ as my first AI automation project
