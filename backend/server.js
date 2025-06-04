require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const axios = require('axios'); // Can be removed if not used elsewhere

const app = express();
app.use(cors());
app.use(express.json());
const tokenCache = {};

app.post('/api/get-devrev-token', async (req, res) => {
    const { email, name } = req.body;

    if (tokenCache[email]) {
        console.log('Using cached session token for:', email);
        return res.status(200).json({ sessionToken: tokenCache[email] });
    }

    console.log("Received request to get DevRev session token for:", { email, name });

    try {
        // Using fetch for this route as well, for consistency
        const devrevResponse = await fetch('https://api.devrev.ai/auth-tokens.create', {
            method: 'POST',
            headers: {
                'authorization': process.env.DEVREV_APP_TOKEN, // This is for session token
                'content-type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                rev_info: {
                    user_ref: email,
                    account_ref: "jeecprime.devrev.ai",
                    workspace_ref: "jeecprime",  // Replace this
                    user_traits: {
                        email: email,
                        display_name: name,
                        phone_numbers: ["+918056663183"],
                        custom_fields: {
                            "tnt__user_role": "basic"
                        }
                    },
                    workspace_traits: {
                        display_name: "JEECPRIME Workspace"
                    },
                    account_traits: {
                        display_name: "JEECPRIME",
                        domains: ["jeecprime.devrev.ai"]
                    }
                }
            })
        });
        console.log('DevRev API response :', devrevResponse);

        console.log('DevRev API response for session token:', devrevResponse.status, devrevResponse.statusText);

        const data = await devrevResponse.json();

        console.log('DevRev API response for session token:', data);

        if (devrevResponse.ok && data.access_token) {
            tokenCache[email] = data.access_token;
            res.status(200).json({ sessionToken: data.access_token });
        } else {
            console.error('DevRev API error for session token:', data);
            if (devrevResponse.status === 409) {
                res.status(409).json({ error: 'User already exists or session conflict. Please try logging out and logging back in, or contact support if the issue persists.', details: data });
            } else {
                res.status(devrevResponse.status || 500).json({ error: 'Failed to generate session token', details: data });
            }
        }

    } catch (error) {
        console.error('Backend error for session token:', error.message);
        res.status(500).json({ error: 'Internal server error', details: { message: error.message } });
    }
});


// New route to create a DevRev issue using fetch
app.post('/api/create-devrev-issue', async (req, res) => {
    const logoutSummary = req.body; // This is the logoutSummaryJSON from the frontend

    if (!logoutSummary || !logoutSummary.userName) {
        return res.status(400).json({ error: 'User summary data is missing or invalid.' });
    }

    const devRevApiToken = process.env.API_TOKEN; // Use the API_TOKEN from .env
    if (!devRevApiToken) {
        console.error('DevRev API_TOKEN is not configured in .env file.');
        return res.status(500).json({ error: 'Server configuration error: API_TOKEN missing.' });
    }

    const issueTitle = `${logoutSummary.userName} Event Tracking`;
    const issueBody = JSON.stringify(logoutSummary, null, 2); 

    const devRevIssuePayload = {
        type: "issue",
        applies_to_part: "PROD-2", 
        owned_by: ["SYSU-1"],      
        title: issueTitle,
        body: issueBody
    };

    try {
        const response = await fetch('https://api.devrev.ai/works.create', {
            method: 'POST',
            headers: {
                'Authorization': process.env.API_TOKEN, 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(devRevIssuePayload)
        });

        const responseData = await response.json();

        if (response.ok) { // fetch uses response.ok (status in 200-299 range)
            console.log('DevRev issue created successfully:', responseData);
            res.status(response.status).json({ message: 'DevRev issue creation initiated successfully.', data: responseData });
        } else {
            console.error('Failed to create DevRev issue:', responseData);
            res.status(response.status).json({ error: 'Failed to create DevRev issue.', details: responseData });
        }
    } catch (error) { // Catches network errors or issues with response.json()
        console.error('Network or parsing error while creating DevRev issue:', error.message);
        res.status(500).json({ error: 'Network or parsing error while creating DevRev issue.', details: { message: error.message } });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`DevRev backend running on port ${PORT}`));