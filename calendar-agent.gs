// CONFIGURATION
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; // Replace with your actual Gemini API key
const FORM_ID = 'YOUR_GOOGLE_FORM_ID_HERE'; // Replace with your form ID

// This function runs automatically when someone submits the form
function onFormSubmit(e) {
  try {
    // Get the form response - try different methods to get the text
    let formResponse = '';
    
    if (e.values && e.values.length > 1) {
      formResponse = e.values[1]; // From spreadsheet
    } else if (e.response) {
      const itemResponses = e.response.getItemResponses();
      if (itemResponses.length > 0) {
        formResponse = itemResponses[0].getResponse(); // From form directly
      }
    }
    
    if (!formResponse) {
      throw new Error('Could not get form response');
    }
    
    const userEmail = Session.getActiveUser().getEmail();
    
    Logger.log('Processing form submission: ' + formResponse);
    
    // Send to Gemini AI to extract events
    const events = extractEventsWithGemini(formResponse);
    
    Logger.log('Events extracted: ' + JSON.stringify(events));
    
    // Add events to calendar
    const addedEvents = addEventsToCalendar(events);
    
    // Send confirmation email
    sendConfirmation(userEmail, addedEvents, formResponse);
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    const userEmail = Session.getActiveUser().getEmail();
    MailApp.sendEmail(userEmail, 
                     'Calendar Agent Error', 
                     'An error occurred while processing your day plan: ' + error.toString());
  }
}

// Function to call Gemini API and extract events
function extractEventsWithGemini(text) {
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;  
  const today = new Date();
  const prompt = `Extract calendar events from this text. Today's date is ${today.toDateString()}.

For each event, identify:
- Event title/description
- Date (if relative like "tomorrow", calculate from today. If "today", use today's date)
- Start time (use 24-hour format like 14:00 for 2pm)
- Duration in minutes (estimate based on context, default 60 minutes)

IMPORTANT: 
- For "tomorrow", add 1 day to today's date
- For times like "7am", convert to "07:00"
- For times like "2pm", convert to "14:00"
- For time ranges like "8am to 3pm" or "10am to 12pm", calculate duration in minutes

Return ONLY a valid JSON array, no other text:
[
  {
    "title": "event name",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "duration": 60
  }
]

Text: ${text}`;

  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const jsonResponse = JSON.parse(response.getContentText());
  
  Logger.log('Gemini response: ' + response.getContentText());
  
  // Extract the text from Gemini's response
  if (jsonResponse.candidates && jsonResponse.candidates[0].content.parts[0].text) {
    let responseText = jsonResponse.candidates[0].content.parts[0].text;
    
    // Clean up the response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse the JSON
    const events = JSON.parse(responseText);
    return events;
  }
  
  return [];
}

// Function to add events to Google Calendar
function addEventsToCalendar(events) {
  const calendar = CalendarApp.getDefaultCalendar();
  const addedEvents = [];
  
  events.forEach(event => {
    try {
      // Parse date and time
      const eventDate = new Date(event.date + ' ' + event.startTime);
      const endDate = new Date(eventDate.getTime() + (event.duration * 60000));
      
      // Create calendar event
      const calendarEvent = calendar.createEvent(event.title, eventDate, endDate);
      
      addedEvents.push({
        title: event.title,
        date: eventDate.toLocaleString(),
        startTime: event.startTime,
        duration: event.duration
      });
      
      Logger.log(`Added event: ${event.title} at ${eventDate}`);
      
    } catch (error) {
      Logger.log(`Error adding event ${event.title}: ${error.toString()}`);
    }
  });
  
  return addedEvents;
}

// Function to send confirmation email
function sendConfirmation(userEmail, addedEvents, originalText) {
  if (addedEvents.length === 0) {
    MailApp.sendEmail(userEmail, 
                     '❌ Calendar Agent - No Events Found', 
                     `I processed your submission but couldn't find any clear events to add.\n\nYour text was:\n"${originalText}"\n\nTry being more specific with dates and times. For example:\n- "Meeting tomorrow at 2pm"\n- "Gym on October 15 at 4pm"`);
    return;
  }
  
  let confirmationBody = `✅ Successfully added ${addedEvents.length} event(s) to your calendar!\n\n`;
  
  addedEvents.forEach((event, index) => {
    confirmationBody += `${index + 1}. ${event.title}\n   📅 ${event.date}\n   ⏰ Duration: ${event.duration} minutes\n\n`;
  });
  
  confirmationBody += `\nYour original text:\n"${originalText}"`;
  
  MailApp.sendEmail(userEmail, 
                   '✅ Calendar Agent - Events Added!', 
                   confirmationBody);
}

// Function to set up the trigger (run this ONCE manually)
function setupFormTrigger() {
  // Delete existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Get the form by ID
  const form = FormApp.openById(FORM_ID);
  
  // Create trigger for form submissions
  ScriptApp.newTrigger('onFormSubmit')
    .forForm(form)
    .onFormSubmit()
    .create();
  
  Logger.log('✅ Form trigger set up successfully! Your agent is ready.');
  
  // Send confirmation
  const userEmail = Session.getActiveUser().getEmail();
  MailApp.sendEmail(userEmail, 
                   'Calendar Agent Setup Complete', 
                   'Your Calendar Agent is now active! Submit your form to start adding events automatically.');
}
