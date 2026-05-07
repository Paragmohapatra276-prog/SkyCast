// OpenWeather API Key
const API_KEY = "68f876fcbf5a30329bdb8ddc583858a9";

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchIcon = document.querySelector('.search-icon');
const errorMessage = document.getElementById('error-message');
const weatherContent = document.getElementById('weather-content');
const loading = document.getElementById('loading');
const weatherBg = document.getElementById('weather-bg');
const bgAnimation = document.getElementById('bg-animation');

// Current Weather Elements
const cityNameEl = document.getElementById('city-name');
const localTimeEl = document.getElementById('local-time');
const temperatureEl = document.getElementById('temperature');
const weatherConditionEl = document.getElementById('weather-condition');

// Highlight Elements
const feelsLikeEl = document.getElementById('feels-like');
const windSpeedEl = document.getElementById('wind-speed');
const humidityEl = document.getElementById('humidity');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const visibilityEl = document.getElementById('visibility');
const pressureEl = document.getElementById('pressure');

// Forecast Elements
const forecastContainer = document.getElementById('forecast-container');

// Event Listeners
searchIcon.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) getWeatherData(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) getWeatherData(city);
    }
});

// Initial load
window.addEventListener('DOMContentLoaded', () => {
    getWeatherData('Delhi');
});

async function getWeatherData(city) {
    hideError();
    weatherContent.classList.add('hidden');
    loading.classList.remove('hidden');

    try {
        // Fetch Current Weather
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city},IN&appid=${API_KEY}&units=metric`;
        const weatherRes = await fetch(weatherUrl);

        if (!weatherRes.ok) throw new Error(`City not found (${weatherRes.status})`);
        const weatherData = await weatherRes.json();

        // Fetch Forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city},IN&appid=${API_KEY}&units=metric`;
        const forecastRes = await fetch(forecastUrl);
        let forecastData = null;
        if (forecastRes.ok) forecastData = await forecastRes.json();

        updateUI(weatherData, forecastData);

    } catch (error) {
        console.error("Error:", error);
        showError();
        loading.classList.add('hidden');
    }
}

function updateUI(weather, forecast) {
    if (!weather) return;

    // Hero Section Update
    cityNameEl.textContent = weather.name;
    temperatureEl.textContent = Math.round(weather.main.temp);
    weatherConditionEl.textContent = weather.weather[0].description;

    updateLocalTime(weather.timezone);
    updateBackground(weather.weather[0].main, weather.weather[0].icon);

    // Metrics Update
    feelsLikeEl.textContent = Math.round(weather.main.feels_like);
    windSpeedEl.textContent = Math.round(weather.wind.speed * 3.6);
    humidityEl.textContent = weather.main.humidity;
    visibilityEl.textContent = (weather.visibility / 1000).toFixed(1);
    pressureEl.textContent = weather.main.pressure;

    // Parse Sunrise/Sunset
    sunriseEl.textContent = formatTime(weather.sys.sunrise, weather.timezone);
    sunsetEl.textContent = formatTime(weather.sys.sunset, weather.timezone);

    // Forecast Update
    if (forecast) {
        updateForecast(forecast.list, weather.timezone);
    }

    // Show Content
    loading.classList.add('hidden');
    weatherContent.classList.remove('hidden');
}

function formatTime(unixTimeStamp, timezoneOffset) {
    const d = new Date((unixTimeStamp + timezoneOffset) * 1000);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
}

function updateLocalTime(timezoneOffsetSeconds) {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const localTime = new Date(utc + (timezoneOffsetSeconds * 1000));
    // Apple Weather usually just says the time or day loosely, but we'll put full time
    const options = { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true };
    localTimeEl.textContent = localTime.toLocaleDateString('en-US', options);
}

function updateBackground(weatherMain, iconCode) {
    weatherBg.className = 'weather-bg';
    if (!weatherMain || !iconCode) return;

    // Check if it's night time based on icon code ('n' means night)
    const isNight = iconCode.includes('n');

    if (isNight) {
        weatherBg.classList.add('night');
        return;
    }

    const condition = weatherMain.toLowerCase();

    if (condition.includes('clear')) weatherBg.classList.add('sunny');
    else if (condition.includes('cloud')) weatherBg.classList.add('cloudy');
    else if (condition.includes('rain') || condition.includes('drizzle')) weatherBg.classList.add('rainy');
    else if (condition.includes('thunderstorm')) weatherBg.classList.add('thunderstorm');
    else weatherBg.classList.add('default');
}

function updateForecast(forecastList, timezoneOffset) {
    forecastContainer.innerHTML = '';

    // Grab the next 8 items (roughly 24 hours of 3-hour intervals) or mix of days
    // To mimic Apple weather, the horizontal scroller usually shows hourly data.
    // Since we have 3-hour intervals, we will show the next 8 intervals.
    const hourlyData = forecastList.slice(0, 8);

    hourlyData.forEach(item => {
        const dateObj = new Date((item.dt + timezoneOffset) * 1000);

        // Format time to '3 PM'
        let hours = dateObj.getUTCHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const timeStr = `${hours} ${ampm}`;

        const temp = Math.round(item.main.temp);
        const icon = item.weather[0].icon;

        const cardHTML = `
            <div class="forecast-item">
                <span class="f-time">${timeStr}</span>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="icon" class="f-icon">
                <span class="f-temp">${temp}°</span>
            </div>
        `;
        forecastContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function showError() {
    errorMessage.classList.remove('hidden');
    setTimeout(() => errorMessage.classList.add('hidden'), 4000);
}

function hideError() {
    errorMessage.classList.add('hidden');
}
