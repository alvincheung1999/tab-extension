const { DateTime } = luxon;

document.addEventListener("DOMContentLoaded", () => {
  function showLoading() {
    document.getElementById("loadingMessage").style.display = "block";
    document.getElementById("weatherChart").style.display = "none";
  }
  
  function hideLoading() {
    document.getElementById("loadingMessage").style.display = "none";
    document.getElementById("weatherChart").style.display = "block";
  }
  
  function initWeather() {
    showLoading();
    const weatherBox = document.getElementById("weatherBox");
    const chartContainer = document.getElementById("weatherChart");
    if (!weatherBox || !chartContainer) return;

    const cacheKey = `weatherCache`;
    const cacheTimestampKey = `weatherCacheTimestamp`;
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTimestamp = localStorage.getItem(cacheTimestampKey);

    // Only fetch new data if more than 1 hour has passed
    const oneHour = 60 * 60 * 1000;
    if (cachedData && cachedTimestamp && Date.now() - Number(cachedTimestamp) < oneHour) {
      renderChart(JSON.parse(cachedData));
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async pos => {
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

        let locationName = '';
        try {
          const locRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const locData = await locRes.json();
          locationName = locData.address.city || locData.address.town || locData.address.village || locData.address.state || '';
        } catch (e) {
          console.warn("Reverse geocoding failed", e);
        }

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,precipitation_probability,uv_index,weather_code&timeformat=iso8601&timezone=${encodeURIComponent(tz)}`;

        fetch(url)
          .then(res => res.json())
          .then(data => {
            const payload = { data, lat, lon, locationName, tz };
            localStorage.setItem(cacheKey, JSON.stringify(payload));
            localStorage.setItem(cacheTimestampKey, Date.now().toString());
            renderChart(payload);
          })
          .catch(err => {
            console.error("Weather fetch error:", err);
            weatherBox.textContent = "Weather error.";
          });
      }, err => {
        console.warn("Geolocation error:", err);
        weatherBox.textContent = "Location denied.";
      });
    } else {
      weatherBox.textContent = "Geolocation not supported.";
    }
  }

  function renderChart({ data, lat, lon, locationName, tz }) {
    const chartContainer = document.getElementById("weatherChart");
    if (!chartContainer) return;

    const now = DateTime.now().setZone(tz);
    const nowMinusBuffer = now.minus({ hours: 2 });
    const nowISO = nowMinusBuffer.toISO();

    const index = data.hourly.time.findIndex(t => t >= nowISO);
    const currentTimeIndex = data.hourly.time.findIndex(t => t >= now.toISO());
    const plotLineIndex = currentTimeIndex - index;

    if (index < 0) return;

    const hoursToShow = Math.min(24 * 7, data.hourly.time.length);
    if (hoursToShow <= 0) {
      chartContainer.textContent = "No weather data available.";
      return;
    }

    const time = [];
    const tickPositions = [];

    for (let i = 0; i < hoursToShow; i++) {
      const t = data.hourly.time[index + i];
      const dt = DateTime.fromISO(t, { zone: tz });
      const hour = dt.hour;
      const day = dt.toFormat('ccc');
      const dayNum = dt.toFormat('d');
    
      if (hour === 0) {
        time.push(`${day}-${dayNum}`);
        tickPositions.push(i);
      } else if (hour === 12) {
        time.push('12PM');
        tickPositions.push(i);
      } else {
        time.push('');
      }
    }
    

    const temp = data.hourly.temperature_2m.slice(index, index + hoursToShow);
    const rain = data.hourly.precipitation.slice(index, index + hoursToShow);
    const rainProb = data.hourly.precipitation_probability.slice(index, index + hoursToShow);
    const uv = data.hourly.uv_index.slice(index, index + hoursToShow);
    const weatherCodes = data.hourly.weather_code.slice(index, index + hoursToShow);

    const rainSeries = rain.map((val, i) => {
      const prob = rainProb[i];
      const opacity = Math.min(0.3 + prob / 100, 1);
      return {
        y: val,
        color: `rgba(100, 181, 246, ${opacity})`
      };
    });

    const emojiMap = code => {
      if ([0, 1].includes(code)) return '☀️ Clear';
      if (code === 2) return '🌤️ Partly Cloudy';
      if (code === 3) return '☁️ Overcast';
      if ([45, 48].includes(code)) return '🌫️ Fog';
      if ([51, 53, 55].includes(code)) return '🌦️ Light Drizzle';
      if ([56, 57].includes(code)) return '🌧️ Freezing Drizzle';
      if ([61, 63, 65].includes(code)) return '🌧️ Rain';
      if ([66, 67].includes(code)) return '🌧️ Freezing Rain';
      if ([71, 73, 75].includes(code)) return '🌨️ Snowfall';
      if (code === 77) return '🌨️ Snow Grains';
      if ([80, 81, 82].includes(code)) return '🌧️ Showers';
      if ([85, 86].includes(code)) return '❄️ Snow Showers';
      if ([95].includes(code)) return '⛈️ Thunderstorm';
      if ([96, 99].includes(code)) return '⛈️ Thunderstorm + Hail';
      return '❓ Unknown';
    };

    Highcharts.chart('weatherChart', {
      chart: {
        backgroundColor: '#121212',
        style: { fontFamily: 'Segoe UI, sans-serif' },
        height: 600
      },
      title: {
        text: `Weather in ${locationName || `${lat}, ${lon}`}`,
        style: { color: '#fff' }
      },
      xAxis: {
        categories: time,
        tickPositions: tickPositions,
        labels: {
          style: { color: '#ccc', fontSize: '14px' },
          formatter: function () {
            return this.value !== '' ? this.value : null;
          }
        },
        tickLength: 8,
        tickWidth: 1,
        tickColor: '#ffffff',
        tickPosition: 'outside',
        lineColor: '#ccc',
        lineWidth: 1,
        plotLines: [{
          color: '#fff',
          width: 2,
          value: plotLineIndex,
          dashStyle: 'Dash',
          zIndex: 5,
          label: {
            align: 'center',
            style: { color: '#fff'}
          }
        }],
        
      },
      yAxis: [
        {
          title: { text: 'Temperature (°C)', style: { color: '#fff' } },
          labels: {
            style: { color: '#fff' },
            formatter: function () {
              const value = this.value;
              if (value <= 5) return `<span style="color:#1976d2">${value}</span>`;
              if (value <= 15) return `<span style="color:#4fc3f7">${value}</span>`;
              if (value <= 25) return `<span style="color:#81d4fa">${value}</span>`;
              if (value <= 30) return `<span style="color:#ffb74d">${value}</span>`;
              if (value <= 35) return `<span style="color:#ef5350">${value}</span>`;
              return `<span style="color:#b71c1c">${value}</span>`;
            },
            useHTML: false
          },
          opposite: false
        },
        {
          title: { text: 'Precipitation (mm)', style: { color: '#64b5f6' } },
          labels: { style: { color: '#64b5f6' } },
          opposite: false,
          offset: 60
        },
        {
          title: { text: 'UV Index', style: { color: '#9575cd' } },
          labels: { style: { color: '#9575cd' } },
          opposite: true,
        }
      ],
      legend: {
        itemStyle: { color: '#fff' }
      },
      tooltip: {
        shared: true,
        backgroundColor: '#1e1e1e',
        borderColor: '#444',
        style: {
          color: '#fff',
          fontSize: '16px',
          opacity: 1
        },
        shadow:true,
        useHTML: true,
        formatter: function () {
          const startIndex = data.hourly.time.findIndex(t => t >= nowISO);
          const relIndex = this.points[0].point.index;
          const index = startIndex + relIndex;
          const dt = DateTime.fromISO(data.hourly.time[index], { zone: tz });

          console.log(dt);
          console.log(tz);

          const dateStr = dt.toFormat('ccc, LLL d · hh:mm a' );
        
          const description = emojiMap(weatherCodes[index]);
          let tooltip = `<b>${dateStr}</b> ${description}<br/>`;
          tooltip += `Chance of Precipitation: <b>${rainProb[index]}%</b><br/>`;
          this.points.forEach(p => {
            tooltip += `<span style="color:${p.color}">●</span> ${p.series.name}: <b>${p.y}</b><br/>`;
          });
          return tooltip;
        }        
        
        
      },
      plotOptions: {
        column: {
          borderWidth: 0
        }
      },
      series: [
        {
          name: 'Temperature (°C)',
          data: temp,
          type: 'spline',
          lineWidth: 4,
          color: '#ffcc80',
          yAxis: 0,
          marker: { enabled: false },
          tooltip: { valueSuffix: ' °C' },
          zones: [
            { value: 5, color: '#1976d2' },
            { value: 15, color: '#4fc3f7' },
            { value: 25, color: '#81d4fa' },
            { value: 30, color: '#ffb74d' },
            { value: 35, color: '#ef5350' },
            { color: '#b71c1c' }
          ]
        },
        {
          name: 'Precipitation (mm)',
          data: rainSeries,
          type: 'column',
          yAxis: 1,
          color: '#64b5f6',
          tooltip: { valueSuffix: ' mm' }
        },
        {
          name: 'UV Index',
          data: uv,
          type: 'spline',
          yAxis: 2,
          color: '#9575cd',
          marker: { enabled: false },
          tooltip: { valueSuffix: '' }
        }
      ],
      credits: { enabled: false },
      responsive: true
    });
    hideLoading();
  }

  initWeather();
});
