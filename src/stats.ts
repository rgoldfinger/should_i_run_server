import { type Env } from "./env.ts";

export function serveStatsPage(): Response {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BART API Analytics</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .controls {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #2563eb;
        }
        .metric-label {
            color: #6b7280;
            margin-top: 5px;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .time-range-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        .time-range-btn {
            padding: 8px 16px;
            border: 1px solid #d1d5db;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .time-range-btn.active {
            background: #2563eb;
            color: white;
            border-color: #2563eb;
        }
        .time-range-btn:hover {
            background: #f3f4f6;
        }
        .time-range-btn.active:hover {
            background: #1d4ed8;
        }
        .checkbox-group {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #6b7280;
        }
        .error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>BART API Analytics Dashboard</h1>
        <p>Real-time analytics for API usage and user engagement</p>
    </div>

    <div class="controls">
        <h3>Time Range</h3>
        <div class="time-range-buttons">
            <button class="time-range-btn active" data-days="1">1 Day</button>
            <button class="time-range-btn" data-days="30">30 Days</button>
            <button class="time-range-btn" data-days="90">90 Days</button>
            <button class="time-range-btn" data-days="180">6 Months</button>
            <button class="time-range-btn" data-days="365">1 Year</button>
            <button class="time-range-btn" data-days="1825">5 Years</button>
        </div>
        
        <h3>Metrics to Display</h3>
        <div class="checkbox-group">
            <div class="checkbox-item">
                <input type="checkbox" id="uniqueSessions" checked>
                <label for="uniqueSessions">Unique Sessions</label>
            </div>
            <div class="checkbox-item">
                <input type="checkbox" id="uniqueUsers" checked>
                <label for="uniqueUsers">Unique Users</label>
            </div>
            <div class="checkbox-item">
                <input type="checkbox" id="requests" checked>
                <label for="requests">Total Requests</label>
            </div>
        </div>
        
        <h3>User Identification</h3>
        <div class="checkbox-group">
            <div class="checkbox-item">
                <input type="radio" id="idFallback" name="identification" value="fallback" checked>
                <label for="idFallback">All Users (Total)</label>
            </div>
            <div class="checkbox-item">
                <input type="radio" id="idExplicit" name="identification" value="explicit">
                <label for="idExplicit">Explicit IDs Only</label>
            </div>
        </div>
    </div>

    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-value" id="totalSessions">-</div>
            <div class="metric-label">Unique Sessions</div>
        </div>
        <div class="metric-card">
            <div class="metric-value" id="totalUsers">-</div>
            <div class="metric-label">Unique Users</div>
        </div>
        <div class="metric-card">
            <div class="metric-value" id="totalRequests">-</div>
            <div class="metric-label">Total Requests</div>
        </div>
    </div>

    <div class="chart-container">
        <canvas id="analyticsChart" width="400" height="200"></canvas>
    </div>

    <div id="loading" class="loading" style="display: none;">
        Loading analytics data...
    </div>

    <div id="error" class="error" style="display: none;"></div>

    <script>
        let chart;
        let currentTimeRange = 1;
        let currentIdentification = 'fallback';

        // Initialize chart
        function initChart() {
            const ctx = document.getElementById('analyticsChart').getContext('2d');
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Unique Sessions',
                            data: [],
                            borderColor: '#2563eb',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            tension: 0.1,
                            hidden: false
                        },
                        {
                            label: 'Unique Users',
                            data: [],
                            borderColor: '#dc2626',
                            backgroundColor: 'rgba(220, 38, 38, 0.1)',
                            tension: 0.1,
                            hidden: false
                        },
                        {
                            label: 'Total Requests',
                            data: [],
                            borderColor: '#16a34a',
                            backgroundColor: 'rgba(22, 163, 74, 0.1)',
                            tension: 0.1,
                            hidden: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: true
                        }
                    }
                }
            });
        }

        // Load analytics data
        async function loadAnalytics(days = 1, identification = 'both') {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('error').style.display = 'none';
            
            try {
                const response = await fetch(\`/admin/api/analytics?days=\${days}&identification=\${identification}\`);
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const data = await response.json();
                updateChart(data);
                updateMetrics(data);
            } catch (error) {
                console.error('Error loading analytics:', error);
                document.getElementById('error').textContent = \`Error loading analytics: \${error.message}\`;
                document.getElementById('error').style.display = 'block';
            } finally {
                document.getElementById('loading').style.display = 'none';
            }
        }

        // Update chart with new data
        function updateChart(data) {
            chart.data.labels = data.timePeriods;
            chart.data.datasets[0].data = data.uniqueSessions;
            chart.data.datasets[1].data = data.uniqueUsers;
            chart.data.datasets[2].data = data.requests;
            chart.update();
        }

        // Update metric cards
        function updateMetrics(data) {
            document.getElementById('totalSessions').textContent = data.totals.uniqueSessions.toLocaleString();
            document.getElementById('totalUsers').textContent = data.totals.uniqueUsers.toLocaleString();
            document.getElementById('totalRequests').textContent = data.totals.requests.toLocaleString();
        }

        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            initChart();
            loadAnalytics(currentTimeRange, currentIdentification);

            // Time range buttons
            document.querySelectorAll('.time-range-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.time-range-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentTimeRange = parseInt(this.dataset.days);
                    loadAnalytics(currentTimeRange, currentIdentification);
                });
            });

            // Identification method radio buttons
            document.querySelectorAll('input[name="identification"]').forEach(radio => {
                radio.addEventListener('change', function() {
                    currentIdentification = this.value;
                    loadAnalytics(currentTimeRange, currentIdentification);
                });
            });

            // Metric checkboxes
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const datasetIndex = {
                        'uniqueSessions': 0,
                        'uniqueUsers': 1,
                        'requests': 2
                    }[this.id];
                    
                    chart.data.datasets[datasetIndex].hidden = !this.checked;
                    chart.update();
                });
            });
        });
    </script>
</body>
</html>`;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

export async function fetchAnalyticsData(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days') || '1');
  const identification = url.searchParams.get('identification') || 'fallback';
  
  // Check if required environment variables are set
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
    return new Response(JSON.stringify({ 
      error: 'Missing required environment variables',
      message: 'CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // First, let's check if we have ANY data at all
    const debugQuery = `SELECT COUNT(*) as total_rows FROM bart_api_analytics`;
    console.log('Debug query - checking total rows:', debugQuery);
    
    const debugResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/sql',
      },
      body: debugQuery
    });

    if (debugResponse.ok) {
      const debugResult = await debugResponse.json() as { data?: any[] };
      console.log('Total rows in dataset:', JSON.stringify(debugResult, null, 2));
    }

    // Check recent data structure using our timestamp in double1
    const sampleQuery = `SELECT blob1, blob2, blob3, blob4, blob5, blob6, double1, _sample_interval FROM bart_api_analytics ORDER BY double1 DESC LIMIT 5`;
    console.log('Sample query:', sampleQuery);
    
    const sampleResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/sql',
      },
      body: sampleQuery
    });

    if (sampleResponse.ok) {
      const sampleResult = await sampleResponse.json() as { data?: any[] };
      console.log('Sample data structure:', JSON.stringify(sampleResult, null, 2));
    }

    // Try querying recent data from the last few hours using our timestamp
    const recentQuery = `SELECT COUNT(*) as recent_count FROM bart_api_analytics WHERE toDateTime(double1) > NOW() - INTERVAL '6' HOUR`;
    console.log('Recent data query:', recentQuery);
    
    const recentResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/sql',
      },
      body: recentQuery
    });

    if (recentResponse.ok) {
      const recentResult = await recentResponse.json() as { data?: any[] };
      console.log('Recent data count:', JSON.stringify(recentResult, null, 2));
    }

    // Determine interval based on time range
    let interval = 'HOUR';
    if (days > 7) interval = 'DAY';
    if (days > 90) interval = 'WEEK';
    
    
    // Query Cloudflare Analytics Engine with time grouping - get all metrics in one query
    const query = `SELECT 
        toStartOfInterval(toDateTime(double1), INTERVAL '1' ${interval}) as period,
        COUNT(DISTINCT blob3) as explicit_sessions,    -- explicit session IDs
        COUNT(DISTINCT blob2) as explicit_users,       -- explicit user IDs  
        COUNT(DISTINCT blob5) as fallback_sessions,    -- fallback session IDs
        COUNT(DISTINCT blob6) as fallback_users,       -- fallback user IDs
        SUM(_sample_interval) as total_requests
      FROM bart_api_analytics
      WHERE toDateTime(double1) > NOW() - INTERVAL '${days}' DAY
      GROUP BY period
      ORDER BY period ASC`;

    console.log('Executing main query:', query);
    
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/sql',
      },
      body: query
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Analytics API error response:', errorText);
      throw new Error(`Analytics API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as { data?: any[] };
    
    console.log('Analytics API result:', JSON.stringify(result, null, 2));
    
    // Process the data for the frontend
    const timePeriods: string[] = [];
    const uniqueSessions: number[] = [];
    const uniqueUsers: number[] = [];
    const requests: number[] = [];
    
    let totalSessions = 0;
    let totalUsers = 0;
    let totalRequests = 0;

    if (result.data && result.data.length > 0) {
      result.data.forEach((row: any) => {
        const period = row.period;
        const explicitSessions = parseInt(row.explicit_sessions);
        const explicitUsers = parseInt(row.explicit_users);
        const fallbackSessions = parseInt(row.fallback_sessions);
        const fallbackUsers = parseInt(row.fallback_users);
        const reqs = parseInt(row.total_requests);
        
        // Apply identification filter logic
        let sessions, users;
        if (identification === 'explicit') {
          sessions = explicitSessions;
          users = explicitUsers;
        } else { // 'fallback' - represents total count since fallback is always generated
          sessions = fallbackSessions; 
          users = fallbackUsers;
        }
        
        timePeriods.push(new Date(period).toLocaleString());
        uniqueSessions.push(sessions);
        uniqueUsers.push(users);
        requests.push(reqs);
        
        totalRequests += reqs;
      });

      // For totals, use the same approach - get all metrics in one query
      const totalQuery = `SELECT 
          COUNT(DISTINCT blob3) as explicit_sessions_total,
          COUNT(DISTINCT blob2) as explicit_users_total,
          COUNT(DISTINCT blob5) as fallback_sessions_total,
          COUNT(DISTINCT blob6) as fallback_users_total,
          SUM(_sample_interval) as total_requests
        FROM bart_api_analytics
        WHERE toDateTime(double1) > NOW() - INTERVAL '${days}' DAY`;

      const totalResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/sql',
        },
        body: totalQuery
      });

      if (totalResponse.ok) {
        const totalResult = await totalResponse.json() as { data?: any[] };
        if (totalResult.data && totalResult.data.length > 0) {
          const row = totalResult.data[0];
          const explicitSessionsTotal = parseInt(row.explicit_sessions_total);
          const explicitUsersTotal = parseInt(row.explicit_users_total);
          const fallbackSessionsTotal = parseInt(row.fallback_sessions_total);
          const fallbackUsersTotal = parseInt(row.fallback_users_total);
          const totalReqs = parseInt(row.total_requests);
          
          // Apply identification filter logic to totals
          if (identification === 'explicit') {
            totalSessions = explicitSessionsTotal;
            totalUsers = explicitUsersTotal;
          } else { // 'fallback' - represents total count since fallback is always generated
            totalSessions = fallbackSessionsTotal;
            totalUsers = fallbackUsersTotal;
          }
          totalRequests = totalReqs;
        }
      }
    }

    return new Response(JSON.stringify({
      timePeriods,
      uniqueSessions,
      uniqueUsers,
      requests,
      totals: {
        uniqueSessions: totalSessions,
        uniqueUsers: totalUsers,
        requests: totalRequests
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch analytics data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}