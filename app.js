// Firebase will be available globally from firebase-config.js

let votes = {};
let comments = {};
let currentCommentTopic = null;

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function startVoting() {
    showPage('voting-page');
    renderTopics();
}

function renderTopics() {
    const container = document.getElementById('topics-container');
    container.innerHTML = '';

    topics.forEach((topic, index) => {
        const topicDiv = document.createElement('div');
        topicDiv.className = 'topic-item';
        topicDiv.innerHTML = `
            <div class="topic-title">${topic}</div>
            <div class="topic-actions">
                <div class="voting-options">
                    ${[1, 2, 3, 4, 5, 0].map(score => `
                        <label class="vote-option" data-topic="${index}" data-score="${score}">
                            <input type="radio" name="topic-${index}" value="${score}" onchange="recordVote(${index}, ${score})">
                            <span>${score === 0 ? 'Unsure' : score}</span>
                        </label>
                    `).join('')}
                </div>
                <button class="comment-btn" onclick="openCommentModal(${index})" id="comment-btn-${index}">
                    💬 Comment
                </button>
            </div>
        `;
        container.appendChild(topicDiv);
    });
}

function recordVote(topicIndex, score) {
    votes[topicIndex] = score;
    updateProgress();
    
    // Update visual selection
    const topicItem = document.querySelectorAll('.topic-item')[topicIndex];
    const options = topicItem.querySelectorAll('.vote-option');
    options.forEach(option => {
        option.classList.remove('selected');
        if (parseInt(option.dataset.score) === score) {
            option.classList.add('selected');
        }
    });
}

function updateProgress() {
    const votedCount = Object.keys(votes).length;
    const totalCount = topics.length;
    const percentage = (votedCount / totalCount) * 100;
    
    document.getElementById('progress-bar').style.width = percentage + '%';
    document.getElementById('progress-text').textContent = `${votedCount} of ${totalCount} topics rated`;
    
    document.getElementById('submit-btn').disabled = votedCount < totalCount;
}

async function submitVotes() {
    try {
        document.getElementById('submit-btn').disabled = true;
        document.getElementById('submit-btn').textContent = 'Submitting...';

        const voteData = {
            votes: votes,
            comments: comments,
            timestamp: new Date(),
            voterCount: 1
        };

        await window.addDoc(window.collection(window.db, 'votes'), voteData);
        
        showSuccess('Votes submitted successfully!');
        setTimeout(() => {
            showPage('results-page');
            loadResults();
        }, 1500);

    } catch (error) {
        console.error('Error submitting votes:', error);
        showError('Failed to submit votes. Please try again.');
        document.getElementById('submit-btn').disabled = false;
        document.getElementById('submit-btn').textContent = 'Submit Votes';
    }
}

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
                        <th>Comments</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map((result, index) => {
                        let scoreClass = '';
                        if (result.rawAverage >= 4) scoreClass = 'score-high';
                        else if (result.rawAverage >= 3) scoreClass = 'score-medium';
                        else if (result.rawAverage > 0) scoreClass = 'score-low';
                        
                        const commentsHtml = result.comments.length > 0 ? `
                            <div class="comments-section">
                                <div class="comments-header">${result.comments.length} comment${result.comments.length !== 1 ? 's' : ''}:</div>
                                ${result.comments.map(comment => `
                                    <div class="comment-item">
                                        <div class="comment-text">${comment.text}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '';
                        
                        return `
                            <tr class="${scoreClass}">
                                <td>${index + 1}</td>
                                <td>
                                    ${result.topic}
                                    ${commentsHtml}
                                </td>
                                <td>${result.average}</td>
                                <td>${result.voteCount}</td>
                                <td>${result.comments.length}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

    } catch (error) {
        console.error('Error loading results:', error);
        document.getElementById('results-container').innerHTML = 
            '<div class="error">Failed to load results. Please try again.</div>';
    }
}

function goToVoting() {
    votes = {};
    comments = {};
    showPage('voting-page');
    renderTopics();
    updateProgress();
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.querySelector('.card').appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    document.querySelector('.card').appendChild(successDiv);
    
    setTimeout(() => successDiv.remove(), 3000);
}

// Load results on page load if coming directly to results
if (window.location.hash === '#results') {
    showPage('results-page');
    loadResults();
}

// Comment modal functions
function openCommentModal(topicIndex) {
    currentCommentTopic = topicIndex;
    document.getElementById('comment-topic-title').textContent = topics[topicIndex];
    document.getElementById('comment-text').value = comments[topicIndex] || '';
    document.getElementById('comment-modal').style.display = 'block';
}

function closeCommentModal() {
    document.getElementById('comment-modal').style.display = 'none';
    currentCommentTopic = null;
    document.getElementById('comment-text').value = '';
}

function submitComment() {
    const commentText = document.getElementById('comment-text').value.trim();
    
    if (currentCommentTopic !== null) {
        if (commentText) {
            comments[currentCommentTopic] = commentText;
            // Update button appearance
            const commentBtn = document.getElementById(`comment-btn-${currentCommentTopic}`);
            commentBtn.classList.add('has-comment');
            commentBtn.textContent = '💬 Edit Comment';
        } else {
            // Remove comment if text is empty
            delete comments[currentCommentTopic];
            const commentBtn = document.getElementById(`comment-btn-${currentCommentTopic}`);
            commentBtn.classList.remove('has-comment');
            commentBtn.textContent = '💬 Comment';
        }
        
        closeCommentModal();
    }
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('comment-modal');
    if (event.target === modal) {
        closeCommentModal();
    }
}