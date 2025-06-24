// Results page JavaScript

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadResults();
});

async function loadResults() {
    try {
        const container = document.getElementById('results-container');
        container.innerHTML = '<div class="loading">Loading results...</div>';

        const votesSnapshot = await window.getDocs(window.collection(window.db, 'votes'));
        
        // Aggregate all votes and comments
        const topicScores = {};
        const topicCounts = {};
        const allComments = {};
        
        topics.forEach((topic, index) => {
            topicScores[index] = 0;
            topicCounts[index] = 0;
            allComments[index] = [];
        });

        votesSnapshot.forEach(doc => {
            const data = doc.data();
            
            // Process votes
            Object.entries(data.votes).forEach(([topicIndex, score]) => {
                if (score > 0) { // Don't count "Unsure" votes in average
                    topicScores[topicIndex] += score;
                    topicCounts[topicIndex] += 1;
                }
            });
            
            // Process comments
            if (data.comments) {
                Object.entries(data.comments).forEach(([topicIndex, comment]) => {
                    if (comment && comment.trim()) {
                        allComments[topicIndex].push({
                            text: comment,
                            timestamp: data.timestamp
                        });
                    }
                });
            }
        });

        // Calculate averages and create results array
        const results = topics.map((topic, index) => ({
            topic,
            average: topicCounts[index] > 0 ? (topicScores[index] / topicCounts[index]).toFixed(2) : 'N/A',
            voteCount: topicCounts[index],
            rawAverage: topicCounts[index] > 0 ? topicScores[index] / topicCounts[index] : 0,
            comments: allComments[index] || []
        }));

        // Sort by average score
        results.sort((a, b) => b.rawAverage - a.rawAverage);

        // Render results table
        container.innerHTML = `
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Topic</th>
                        <th>Average Score</th>
                        <th>Vote Count</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map((result, index) => {
                        let scoreClass = '';
                        if (result.rawAverage >= 4) scoreClass = 'score-high';
                        else if (result.rawAverage >= 3) scoreClass = 'score-medium';
                        else if (result.rawAverage > 0) scoreClass = 'score-low';
                        
                        return `
                            <tr class="${scoreClass}">
                                <td>${index + 1}</td>
                                <td>${result.topic}</td>
                                <td>${result.average}</td>
                                <td>${result.voteCount}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            
            ${renderAllComments(results)}
        `;

        // Render histogram
        renderHistogram(results);

    } catch (error) {
        console.error('Error loading results:', error);
        document.getElementById('results-container').innerHTML = 
            '<div class="error">Failed to load results. Please try again.</div>';
    }
}

function renderAllComments(results) {
    const allComments = results.filter(result => result.comments.length > 0);
    
    if (allComments.length === 0) {
        return '';
    }
    
    return `
        <div class="all-comments-section">
            <h2 class="all-comments-title">💭 All Comments</h2>
            ${allComments.map(result => `
                <div class="topic-comment">
                    <div class="topic-comment-title">${result.topic}</div>
                    ${result.comments.map(comment => `
                        <div class="topic-comment-text">"${comment.text}"</div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

function renderHistogram(results) {
    const histogramContainer = document.getElementById('histogram-container');
    
    // Filter out topics with no votes for histogram
    const votedResults = results.filter(result => result.voteCount > 0);
    
    if (votedResults.length === 0) {
        histogramContainer.innerHTML = '';
        return;
    }
    
    // Create bins for histogram (0.5 increments)
    const bins = [
        { min: 0, max: 0.5, label: '0-0.5', count: 0 },
        { min: 0.5, max: 1, label: '0.5-1', count: 0 },
        { min: 1, max: 1.5, label: '1-1.5', count: 0 },
        { min: 1.5, max: 2, label: '1.5-2', count: 0 },
        { min: 2, max: 2.5, label: '2-2.5', count: 0 },
        { min: 2.5, max: 3, label: '2.5-3', count: 0 },
        { min: 3, max: 3.5, label: '3-3.5', count: 0 },
        { min: 3.5, max: 4, label: '3.5-4', count: 0 },
        { min: 4, max: 4.5, label: '4-4.5', count: 0 },
        { min: 4.5, max: 5, label: '4.5-5', count: 0 }
    ];
    
    // Count topics in each bin
    votedResults.forEach(result => {
        const score = result.rawAverage;
        for (let i = 0; i < bins.length; i++) {
            if (score >= bins[i].min && (score < bins[i].max || (i === bins.length - 1 && score <= bins[i].max))) {
                bins[i].count++;
                break;
            }
        }
    });
    
    // Calculate max count for scaling
    const maxCount = Math.max(...bins.map(bin => bin.count));
    
    // Calculate statistics
    const totalTopics = votedResults.length;
    const avgScore = votedResults.reduce((sum, result) => sum + result.rawAverage, 0) / totalTopics;
    const highScoreTopics = votedResults.filter(result => result.rawAverage >= 4).length;
    
    // Render histogram
    histogramContainer.innerHTML = `
        <div class="histogram">
            <h3 class="histogram-title">Score Distribution</h3>
            <div class="histogram-chart">
                ${bins.map(bin => `
                    <div class="histogram-bar" style="height: ${maxCount > 0 ? (bin.count / maxCount * 120) : 4}px;">
                        <div class="histogram-bar-value">${bin.count}</div>
                        <div class="histogram-bar-label">${bin.label}</div>
                    </div>
                `).join('')}
            </div>
            <div class="histogram-axis-label">Average Score Range</div>
            <div class="histogram-stats">
                <div class="histogram-stat">
                    <span class="histogram-stat-value">${totalTopics}</span>
                    <span class="histogram-stat-label">Total Topics</span>
                </div>
                <div class="histogram-stat">
                    <span class="histogram-stat-value">${avgScore.toFixed(2)}</span>
                    <span class="histogram-stat-label">Overall Average</span>
                </div>
                <div class="histogram-stat">
                    <span class="histogram-stat-value">${highScoreTopics}</span>
                    <span class="histogram-stat-label">High Interest (4+)</span>
                </div>
            </div>
        </div>
    `;
} 