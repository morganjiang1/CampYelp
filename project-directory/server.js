const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/referral-system', { useNewUrlParser: true, useUnifiedTopology: true });

const contactSchema = new mongoose.Schema({
    name: String,
    phone: String,
    interests: [String],
    trust_level: Number,
    past_interactions: [String]
});

const Contact = mongoose.model('Contact', contactSchema);

// Routes
app.post('/contacts', async (req, res) => {
    const { name, phone, interests, trust_level, past_interactions } = req.body;
    const contact = new Contact({ name, phone, interests, trust_level, past_interactions });
    await contact.save();
    res.status(201).send(contact);
});

app.get('/contacts', async (req, res) => {
    const contacts = await Contact.find();
    res.send(contacts);
});

app.post('/referrals', async (req, res) => {
    const { business_type, weights } = req.body;
    const contacts = await Contact.find();
    
    const scoredContacts = contacts.map(contact => ({
        contact,
        score: calculateOverallScore(contact, business_type, weights)
    }));

    scoredContacts.sort((a, b) => b.score - a.score);
    const topReferrals = scoredContacts.slice(0, 5).map(item => item.contact);
    
    res.send(topReferrals);
});

const calculateRelevanceScore = (contact, businessType) => contact.interests.includes(businessType) ? 1 : 0;
const calculateTrustScore = (contact) => contact.trust_level;
const calculateInteractionScore = (contact, businessType) => contact.past_interactions.filter(interaction => interaction === businessType).length;

const calculateOverallScore = (contact, businessType, weights) => {
    const relevanceScore = calculateRelevanceScore(contact, businessType);
    const trustScore = calculateTrustScore(contact);
    const interactionScore = calculateInteractionScore(contact, businessType);
    
    return (weights.relevance * relevanceScore) + (weights.trust * trustScore) + (weights.interaction * interactionScore);
};

// New Route for Google Search and Image
app.post('/google-search', async (req, res) => {
    const { query } = req.body;
    const apiKey = 'AIzaSyADn3U6VN56QGjN08QQieZ_fK9Mf2Ls3wQ';
    const cx = '630d33bb369604bb1'; // Your Custom Search Engine ID
    const apiUrl = `https://www.googleapis.com/customsearch/v1`;

    try {
        console.log(`Searching Google for: ${query}`);
        const response = await axios.get(apiUrl, {
            params: {
                key: apiKey,
                cx: cx,
                q: query,
                searchType: 'image',
                num: 1
            }
        });

        console.log('Google Search API Response:', response.data);

        if (response.data.items && response.data.items.length > 0) {
            const firstLink = response.data.items[0].link;
            const firstImage = response.data.items[0].pagemap.cse_image[0].src;

            res.send({ firstLink, firstImage });
        } else {
            console.log('No results found');
            res.status(404).send('No results found');
        }
    } catch (error) {
        console.error('Error performing Google search:', error.message);
        res.status(500).send('Error performing Google search');
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
