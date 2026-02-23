const express = require('express');
const router = express.Router();
const channelDNA = require('../services/channelDNA');
const channelSearch = require('../services/channelSearch');
const aiSummary = require('../services/aiSummary');

// GET /api/channel/profile?channel=username
router.get('/profile', async (req, res) => {
    try {
        const channel = req.query.channel;
        const refresh = req.query.refresh === 'true';

        if (!channel) {
            return res.status(400).json({ error: 'Missing channel query parameter.' });
        }

        const profile = await channelDNA.getChannelDNA(channel, refresh);
        return res.status(200).json(profile);
    } catch (error) {
        console.error(`❌ [API-CHANNEL] Error fetching profile:`, error.message);
        return res.status(500).json({ error: 'Failed to build or fetch channel DNA profile.' });
    }
});

// GET /api/channel/search?channel=username
router.get('/search', async (req, res) => {
    try {
        const channel = req.query.channel;

        if (!channel) {
            return res.status(400).json({ error: 'Missing channel query parameter.' });
        }

        // 1. Get the Channel DNA
        const profile = await channelDNA.getChannelDNA(channel);

        // 2. Perform the targeted search and ranking
        const results = await channelSearch.searchForChannel(profile);

        // 3. Generate the channel-aware intelligence brief
        const top5 = results.slice(0, 5);
        const summary = await aiSummary.generateChannelSummary(profile, top5);

        return res.status(200).json({ profile, results, summary });
    } catch (error) {
        console.error(`❌ [API-CHANNEL] Error searching for channel:`, error.message);
        return res.status(500).json({ error: 'Failed to search for channel.' });
    }
});

// GET /api/channel/combined
router.get('/combined', async (req, res) => {
    try {
        // Feature to be implemented - placeholder
        return res.status(501).json({ message: 'Combined channel search not yet implemented.' });
    } catch (error) {
        console.error(`❌ [API-CHANNEL] Error in combined search:`, error.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
