let inputMac;

function formatMacAddress(mac) {
    return mac.toLowerCase();
}

async function fetchData() {
    const apiUrl = 'http://10.0.0.3:5005/status';
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

function renderTable(dockInfo) {
    // Get the cell voltage data
    const cellVoltages = dockInfo.cell_voltage_mv;
    const btm = cellVoltages.slice(0, 7);
    const top = cellVoltages.slice(7, 14);
  
    // Calculate max, min, average, and total
    const calcStats = (arr) => {
      const max = Math.max(...arr);
      const min = Math.min(...arr);
      const sum = arr.reduce((a, b) => a + b, 0);
      const avg = sum / arr.length;
      return { max, min, avg, sum };
    };
  
    const btmStats = calcStats(btm);
    const topStats = calcStats(top);
  
    // Helper function to style min and max values
    const styleValue = (value, max, min) => {
      if (value === max) return `<td style="color: blue;">${value}</td>`;
      if (value === min) return `<td style="color: red;">${value}</td>`;
      return `<td>${value}</td>`;
    };
  
    // Render the table with BTM and TOP data, and add footer for summary
    document.querySelector('.result').innerHTML = `
    <p class="caption">Showing Readings for Dock: <strong>${inputMac}</strong></p>
      <table border="1">
        <thead>
          <tr>
            <th>Virtual Cell</th>
            <th>Bottom Brick (mV)</th>
            <th>Top Brick (mV)</th>
          </tr>
        </thead>
        <tbody>
          ${btm.map((value, index) => `
          <tr>
            <td>Cell ${index + 1}</td>
            ${styleValue(value, btmStats.max, btmStats.min)}
            ${styleValue(top[index], topStats.max, topStats.min)}
          </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr><td>Max</td><td style="color: blue;">${btmStats.max}</td><td style="color: blue;">${topStats.max}</td></tr>
          <tr><td>Min</td><td style="color: red;">${btmStats.min}</td><td style="color: red;">${topStats.min}</td></tr>
          <tr><td>Avg</td><td>${btmStats.avg.toFixed(2)}</td><td>${topStats.avg.toFixed(2)}</td></tr>
          <tr><td>Total</td><td>${btmStats.sum}</td><td>${topStats.sum}</td></tr>
        </tfoot>
      </table>
    `;
  }

  async function fetchAndRenderData() {
    const dockData = await fetchData();
  
    if (!dockData) {
      document.querySelector('.result').innerHTML = '<p class="warn-text">Error fetching data!</p>';
      return;
    }
  
    // Find the matching dock based on the MAC address
    const dockKey = Object.keys(dockData).find(key => formatMacAddress(dockData[key].mac_address) === inputMac);
  
    if (!dockKey) {
      document.querySelector('.result').innerHTML = '<p class="warn-text">Dock not found</p>';
      return;
    }
  
    const dockInfo = dockData[dockKey];
  
    // Check if there's no battery inserted
    if (dockInfo.state === 'NO_BATTERY') {
      document.querySelector('.result').innerHTML = '<p class="warn-text">No Battery Inserted</p>';
      return;
    }
  
    // Render the table with updated dock info
    renderTable(dockInfo);
  }  

window.onload = async () => {
    const data = await fetchData();

    if (!data) {
        document.querySelector('.result').innerHTML = '<p class="warn-text">Error connecting to server!</p>';
        return;
    }

    const suggestionList = document.getElementById('suggestions');
    Object.keys(data).forEach(key => {
        const macAddress = data[key].mac_address;
        const option = document.createElement('option');
        option.value = formatMacAddress(macAddress);
        suggestionList.appendChild(option);
    });
};

document.getElementById('fetch-btn').addEventListener('click', async () => {
    const resultElement = document.querySelector('.result');
    resultElement.innerHTML = '<p class="loading-text">Loading data</p>';

    inputMac = document.getElementById('mac-text').value.trim().toLowerCase();

    const dockData = await fetchData();

    if (!dockData) {
        document.querySelector('.result').innerHTML = '<p class="warn-text">Error fetching data!</p>';
        return;
    }

    const dockKey = Object.keys(dockData).find(key => formatMacAddress(dockData[key].mac_address) === inputMac);

    if (!dockKey) {
        document.querySelector('.result').innerHTML = '<p class="warn-text">Dock not found</p>';
        return;
    }

    const dockInfo = dockData[dockKey];

    if (dockInfo.state === 'NO_BATTERY') {
        resultElement.innerHTML = '<p class="warn-text">No Battery Inserted</p>';
        return;
    }

    renderTable(dockInfo);

    setInterval(fetchAndRenderData, 1000);
});
