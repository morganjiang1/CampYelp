document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const getReferralsButton = document.getElementById('get-referrals');
    const referralList = document.getElementById('referral-list');
    const sendChatButton = document.getElementById('send-chat');
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const buttonText = document.getElementById('button-text');
    const loadingSpinner = document.getElementById('loading-spinner');
    const successMessage = document.getElementById('success-message');
    const imageResult = document.getElementById('image-result');
    const resultImage = document.getElementById('result-image');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const interests = document.getElementById('interests').value.split(',').map(item => item.trim());
        const trustLevel = document.getElementById('trust-level').value;
        const pastInteractions = document.getElementById('past-interactions').value.split(',').map(item => item.trim());

        await fetch('/contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, phone, interests, trust_level: trustLevel, past_interactions: pastInteractions })
        });
    });

    getReferralsButton.addEventListener('click', async () => {
        const businessType = document.getElementById('business-type').value;

        const response = await fetch('/referrals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ business_type: businessType, weights: { relevance: 0.5, trust: 0.3, interaction: 0.2 } })
        });

        const referrals = await response.json();
        referralList.innerHTML = '';
        referrals.forEach(referral => {
            const li = document.createElement('li');
            li.textContent = `Name: ${referral.name}, Phone: ${referral.phone}, Interests: ${referral.interests.join(', ')}`;
            referralList.appendChild(li);
        });
    });

    sendChatButton.addEventListener('click', async () => {
        const query = chatInput.value;
        console.log(`User input: ${query}`); // Debug statement

        if (!query) {
            console.error('Input is empty'); // Debug statement
            alert('Please enter a keyword to search.');
            return;
        }

        chatWindow.innerHTML += `<div>User: ${query}</div>`;
        chatInput.value = '';
        buttonText.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
        successMessage.classList.add('hidden');
        imageResult.classList.add('hidden');

        try {
            const response = await fetch('/google-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            console.log('Received result:', result); // Debug statement

            if (result.firstLink && result.firstImage) {
                chatWindow.innerHTML += `<div>Bot: Here is the first link for "${query}": <a href="${result.firstLink}" target="_blank">${result.firstLink}</a></div>`;
                resultImage.src = result.firstImage;
                imageResult.classList.remove('hidden');
                chatWindow.scrollTop = chatWindow.scrollHeight;
                buttonText.classList.remove('hidden');
                loadingSpinner.classList.add('hidden');
                successMessage.classList.remove('hidden');

                setTimeout(() => {
                    successMessage.classList.add('hidden');
                }, 2000);

                // Redirect the user to the first link
                window.location.href = result.firstLink;
            } else {
                console.error('Invalid result received'); // Debug statement
                alert('No valid result found. Please try again.');
                buttonText.classList.remove('hidden');
                loadingSpinner.classList.add('hidden');
            }
        } catch (error) {
            console.error('Fetch error:', error); // Debug statement
            alert('An error occurred while performing the search. Please try again.');
            buttonText.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');
        }
    });
});
