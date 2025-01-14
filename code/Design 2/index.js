// DOM selectors
const weatherForm = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const weatherBackground = document.getElementById("card");
const searchButton = document.getElementById("search-btn");

// API
const apiKey = "69822732ac1661b79f6670b175a16816";
const defaultCity = "Malmö";
let firstClick = true;

// Event listener for weather form submission
weatherForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value;

  if (city) {
    try {
      // Fetch current weather and forecast data
      const { currentWeather, forecast } = await getWeather(city);

      displayWeatherInfo(currentWeather);
      displayWeatherForecast(forecast);
    } catch (error) {
      console.error(error);
      displayError("Failed to fetch weather data. Please try again later.");
    }
  } else {
    displayError("Please enter a city");
  }
});

window.addEventListener("load", async () => {
  try {
    const { currentWeather, forecast } = await getWeather(defaultCity);
    displayWeatherInfo(currentWeather);
    displayWeatherForecast(forecast);

    // Keep the search bar visible after a successful search
    cityInput.style.display = "inline-block";
  } catch (error) {
    console.error(error);
    displayError("Failed to fetch weather data. Please try again later.");
  }
});

searchButton.addEventListener("click", function () {
  if (firstClick) {
    firstClick = false;
    return;
  }

  if (cityInput.value.trim() === "" && cityInput.style.display !== "none") {
    cityInput.style.display = "none";
  } else {
    if (cityInput.style.display === "none") {
      cityInput.style.display = "inline-block";
    } else {
      cityInput.style.display = "none";
    }
  }
});

//Fetch weather data
async function getWeather(city) {
  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;

  const [currentWeatherResponse, forecastResponse] = await Promise.all([
    fetch(currentWeatherUrl),
    fetch(forecastUrl),
  ]);

  if (!currentWeatherResponse.ok || !forecastResponse.ok) {
    throw new Error("Failed to fetch weather data");
  }

  const [currentWeatherData, forecastData] = await Promise.all([
    currentWeatherResponse.json(),
    forecastResponse.json(),
  ]);

  return { currentWeather: currentWeatherData, forecast: forecastData };
}

// Function to adjust sunrise and sunset times based on timezone
function adjustTimezone(sunrise, sunset, timezone) {
  const sunriseTime = new Date((sunrise + timezone) * 1000);
  const sunsetTime = new Date((sunset + timezone) * 1000);
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  };

  const sunriseFormatted = sunriseTime.toLocaleTimeString(undefined, options);
  const sunsetFormatted = sunsetTime.toLocaleTimeString(undefined, options);

  return { sunrise: sunriseFormatted, sunset: sunsetFormatted };
}

// Modify displayWeatherInfo function to use adjusted sunrise and sunset times
function displayWeatherInfo(data) {
  const {
    name: city,
    main: { temp },
    weather: [{ main: description, id }],
    sys: { sunrise, sunset },
    timezone,
  } = data;

  const { sunrise: sunriseTime, sunset: sunsetTime } = adjustTimezone(
    sunrise,
    sunset,
    timezone
  );
  const now = new Date().getTime() / 1000;
  const isNight = now < sunrise || now > sunset;

  // Get the body element
  const body = document.body;
  const iconElement = document.getElementById("current-icon");
  iconElement.src = "";

  // // Apply different background based on whether it's night or day
  if (isNight) {
    body.classList.add("night-mode");
    body.classList.remove("day-mode");
  } else {
    body.classList.add("day-mode");
    body.classList.remove("night-mode");
  }

  weatherBackground.innerHTML = "";

  const tempDisplay = document.createElement("h1");
  const cityDisplay = document.createElement("h2");
  const desDisplay = document.createElement("p");
  const sunDisplay = document.createElement("p");
  const iconDisplay = document.createElement("img");
  const celsiusDisplay = document.createElement("span");

  tempDisplay.textContent = `${(temp - 273.15).toFixed(0)}`;
  tempDisplay.classList.add("current-temp");

  celsiusDisplay.textContent = "°C";
  celsiusDisplay.classList.add("celsius");

  cityDisplay.textContent = city;
  cityDisplay.classList.add("current-city");

  desDisplay.textContent = description;
  desDisplay.classList.add("current-sky");

  iconDisplay.classList.add("current-icon");

  if (isNight) {
    iconDisplay.src = "assets/moon.png";
  } else {
    switch (true) {
      case id === 800:
        iconDisplay.src = "assets/clear.png";
        break;
      case id <= 804:
        iconDisplay.src = "assets/clouds.png";
        break;
      case id <= 504:
        iconDisplay.src = "assets/rain.png";
        break;
      default:
        iconDisplay.src = "assets/clear.png";
    }
  }

  sunDisplay.textContent = `Sunrise: ${sunriseTime} Sunset: ${sunsetTime}`;
  sunDisplay.classList.add("weather-detail");

  weatherBackground.appendChild(iconDisplay);
  weatherBackground.appendChild(tempDisplay);
  weatherBackground.appendChild(celsiusDisplay);
  weatherBackground.appendChild(cityDisplay);
  weatherBackground.appendChild(desDisplay);
  weatherBackground.appendChild(sunDisplay);
}

async function displayWeatherForecast(forecast, isSearchedCity) {
  try {
    const weekDaysContainer = document.getElementById("week-days");
    weekDaysContainer.innerHTML = "";

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const timezoneOffset = forecast.city.timezone; // Get the timezone offset of the city

    const displayedDays = new Set(); // Keep track of displayed days
    let displayedCount = 0; // Keep track of the number of days displayed

    // Iterate over the forecast data
    for (const dayForecast of forecast.list) {
      const date = new Date((dayForecast.dt + timezoneOffset) * 1000);
      const dayIndex = date.getDay();
      const formattedDate = date.toDateString();

      // Check if the day has already been displayed and the displayed count is less than four
      if (!displayedDays.has(formattedDate) && displayedCount < 4) {
        console.log("Processing day index:", dayIndex);

        const tempMin = (dayForecast.main.temp_min - 273.15).toFixed(1);
        const tempMax = (dayForecast.main.temp_max - 273.15).toFixed(1);
        const weatherId = dayForecast.weather[0].id;

        const dayElement = document.createElement("div");
        dayElement.classList.add("week-days");

        const dayName = document.createElement("div");
        dayName.textContent = weekDays[dayIndex];
        dayName.classList.add("day");

        const tempElement = document.createElement("div");
        tempElement.textContent = `${tempMin}°C / ${tempMax}°C`;
        tempElement.classList.add("week-temp");

        const iconElement = document.createElement("img");
        iconElement.classList.add("weather-emoji");

        switch (true) {
          case weatherId === 800:
            iconElement.src = "assets/clear.png";
            break;
          case weatherId <= 804:
            iconElement.src = "assets/clouds.png";
            break;
          case weatherId <= 504:
            iconElement.src = "assets/rain.png";
            break;
          case weatherId >= 300 && weatherId < 400:
            iconElement.src = "assets/drizzle.png";
            break;
          case weatherId >= 500 && weatherId < 600:
            iconElement.src = "assets/rain.png";
            break;
          case weatherId >= 600 && weatherId < 700:
            iconElement.src = "assets/snow.png";
            break;
          default:
            iconElement.src = "assets/clear.png";
        }

        dayElement.appendChild(dayName);
        dayElement.appendChild(iconElement);
        dayElement.appendChild(tempElement);

        weekDaysContainer.appendChild(dayElement);

        displayedDays.add(formattedDate); // Add the displayed day to the set
        displayedCount++; // Increment the displayed count
      }

      // Exit the loop once four days have been displayed
      if (displayedCount >= 4) {
        break;
      }
    }
  } catch (error) {
    console.error(error);
    displayError("Failed to fetch weather forecast. Please try again later.");
  }
}

function displayError(message) {
  const errorDisplay = document.createElement("p");
  errorDisplay.textContent = message;
  errorDisplay.classList.add("error");
  weatherBackground.appendChild(errorDisplay);

  // Show error message quickly
  setTimeout(() => {
    errorDisplay.style.opacity = "1";
  }, 100);

  // Hide error message after 3 seconds
  setTimeout(() => {
    errorDisplay.style.opacity = "0";
    setTimeout(() => {
      errorDisplay.remove();
    }, 500); // Fade out duration
  }, 500); // Error message display duration
}

function hideErrorMessage() {
  errorDisplay.textContent = "";
  errorDisplay.classList.remove("error");
}

// Function to toggle between day and night modes
function toggleDayNightMode(isNight) {
  const body = document.body;
  if (isNight) {
    body.classList.add("night-mode");
    body.classList.remove("day-mode");
  } else {
    body.classList.add("day-mode");
    body.classList.remove("night-mode");
  }
}


// Example: Determine if it's night based on current time (assuming night starts at 6 PM and ends at 6 AM)
function isNightNow() {
  const currentHour = new Date().getHours();
  return currentHour < 6 || currentHour >= 18;
}

// Check if it's night when the page loads and toggle mode accordingly
window.addEventListener("load", () => {
  const isNight = isNightNow();
  toggleDayNightMode(isNight);
});

// Example: Set up a timer to check for day/night mode every minute
setInterval(() => {
  const isNight = isNightNow();
  toggleDayNightMode(isNight);
}, 60000);

