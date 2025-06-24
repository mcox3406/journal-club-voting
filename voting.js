// Voting page JavaScript
let votes = {};
let comments = {};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    renderTopics();
    updateProgress();
});

function renderTopics() {
    const container = document.getElementById('topics-container');
    container.innerHTML = '';

    topics.forEach((topic, index) => {
        const topicDiv = document.createElement('div');
        topicDiv.className = 'topic-item';
        topicDiv.innerHTML = `
            <div class="topic-title">${topic}</div>
            <div class="voting-options">
                ${[1, 2, 3, 4, 5, 0].map(score => `
                    <label class="vote-option" data-topic="${index}" data-score="${score}">
                        <input type="radio" name="topic-${index}" value="${score}" onchange="recordVote(${index}, ${score})">
                        <span>${score === 0 ? 'Unsure' : score}</span>
                    </label>
                `).join('')}
                <div class="comment-box" onclick="toggleComment(${index})" id="comment-box-${index}">
                    💬 Comment
                </div>
            </div>
            <div class="comment-input-container" id="comment-container-${index}">
                <textarea class="comment-input" id="comment-input-${index}" placeholder="Share your thoughts about this topic..."></textarea>
                <div class="comment-actions">
                    <button class="comment-save" onclick="saveComment(${index})">Save</button>
                    <button class="comment-cancel" onclick="cancelComment(${index})">Cancel</button>
                </div>
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
            window.location.href = 'results.html';
        }, 1500);

    } catch (error) {
        console.error('Error submitting votes:', error);
        showError('Failed to submit votes. Please try again.');
        document.getElementById('submit-btn').disabled = false;
        document.getElementById('submit-btn').textContent = 'Submit Votes';
    }
}

// Comment functions
function toggleComment(topicIndex) {
    const container = document.getElementById(`comment-container-${topicIndex}`);
    const commentBox = document.getElementById(`comment-box-${topicIndex}`);
    const input = document.getElementById(`comment-input-${topicIndex}`);
    
    if (container.classList.contains('active')) {
        container.classList.remove('active');
        commentBox.classList.remove('active');
    } else {
        container.classList.add('active');
        commentBox.classList.add('active');
        input.value = comments[topicIndex] || '';
        input.focus();
    }
}

function saveComment(topicIndex) {
    const input = document.getElementById(`comment-input-${topicIndex}`);
    const commentText = input.value.trim();
    const container = document.getElementById(`comment-container-${topicIndex}`);
    const commentBox = document.getElementById(`comment-box-${topicIndex}`);
    
    if (commentText) {
        comments[topicIndex] = commentText;
        commentBox.textContent = '💬 Edit Comment';
        commentBox.style.background = '#ffc107';
        commentBox.style.color = 'white';
    } else {
        delete comments[topicIndex];
        commentBox.textContent = '💬 Comment';
        commentBox.style.background = '#fff3cd';
        commentBox.style.color = '#856404';
    }
    
    container.classList.remove('active');
    commentBox.classList.remove('active');
}

function cancelComment(topicIndex) {
    const container = document.getElementById(`comment-container-${topicIndex}`);
    const commentBox = document.getElementById(`comment-box-${topicIndex}`);
    
    container.classList.remove('active');
    commentBox.classList.remove('active');
}

// Utility functions
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