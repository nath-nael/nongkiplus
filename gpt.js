const apiKey =
  "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";
const userInput = document.getElementById("userInput");
const chatMessages = document.getElementById("chatMessages");
const sendButton = document.getElementById("sendButton");
let lastRecommendation = "";
// Add message to the chat
function addMessage(content, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.textContent = content;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
}

// Send message
sendButton.addEventListener("click", async () => {
  console.log(window.placelist);
  console.log("list: ");
  const places = window.placelist;
  const userMessage = userInput.value.trim();
  if (userMessage === "") return;

  addMessage(userMessage, "user");
  userInput.value = "";

  // Simulate loading
  addMessage("Typing...", "bot");

  const premadePrompt = `Based on this request: "${userMessage}", 
  give me a suitable response. 
  If it's about places, recommend top 1 from this list: ${JSON.stringify(
    window.placelist
  )}. start your response with "Recommended place: (place name).", then give reason casually`;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: premadePrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error("Error with OpenAI API request");
    }

    const data = await response.json();

    // Replace "Typing..." with the bot's reply
    const reply = data.choices[0].message.content;
    const match = reply.match(/Recommended place: ([^.]+)/); // Looks for a quoted place name
    if (match) {
      lastRecommendation = match[1]; // Store the extracted place name
      localStorage.setItem("lastRecommendation", lastRecommendation); // Save in localStorage
      console.log("Saved recommendation:", lastRecommendation);
    }
    chatMessages.lastChild.textContent = reply;
  } catch (error) {
    chatMessages.lastChild.textContent = "Error: Unable to fetch response.";
    console.error(error);
  }

  if (lastRecommendation) {
    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      lastRecommendation
    )}`;

    console.log("Google Maps Link:", googleMapsLink);

    // Add it to the chat or display it on the page
    document.getElementById(
      "mapsLink"
    ).innerHTML = `<a href="${googleMapsLink}" target="_blank"
    style="text-decoration: none;
  color: rgb(255, 221, 85);"
    >Open ${lastRecommendation} on Google Maps</a>`;
    const googleMapsURL = `https://www.google.com/maps?q=${encodeURIComponent(
      lastRecommendation
    )}&output=embed`;

    console.log("Embedded Google Maps URL:", googleMapsURL);

    // Set the iframe source to show the map inside the web app
    document.getElementById("mapsFrame").src = googleMapsURL;
  } else {
    console.log("No recommendation saved.");
  }
});

// Send message on Enter key press
userInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") sendButton.click();
});
