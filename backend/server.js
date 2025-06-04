require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/get-devrev-token', async (req, res) => {
    const { email, name } = req.body;

    try {
        const devrevResponse = await fetch('https://api.devrev.ai/auth-tokens.create', {
            method: 'POST',
            headers: {
                'authorization': process.env.DEVREV_APP_TOKEN,
                'content-type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                rev_info: {
                    user_ref: email,
                    account_ref: "devrev.com",
                    // workspace_ref: "your-workspace-ref",  // Replace this
                    user_traits: {
                        email: email,
                        display_name: name,
                        phone_numbers: ["+911122334455"]
                    },
                    workspace_traits: {
                        display_name: "jeecprime"
                    },
                    account_traits: {
                        display_name: "jeeva-abishake",
                        domains: ["app.devrev.ai"]
                    }
                }
            })
        });

        const data = await devrevResponse.json();

        if (devrevResponse.ok && data.access_token) {
            res.status(200).json({ sessionToken: data.access_token });
        } else {
            console.error('DevRev API error:', data);
            res.status(500).json({ error: 'Failed to generate session token', details: data });
        }

    } catch (error) {
        console.error('Backend error:', error);
        res.status(500).json({ error: 'Internal server error' });
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

app.post('/api/submit-order', async (req, res) => {
  const { name, email, orderDetails, total } = req.body;

  try {
    // 1. Validate the data (e.g., check if required fields are present)
    if (!name || !email || !orderDetails || !total) {
      return res.status(400).json({ error: 'Missing required order information' });
    }

    // 2. Process the order (e.g., store in database)
    // (Replace this with your actual database logic)
    console.log('Received order:', { name, email, orderDetails, total });

    // 3. Send confirmation email (optional)
    // (Replace this with your actual email sending logic)

    // 4. Respond to the client
    res.status(200).json({ message: 'Order submitted successfully' });

  } catch (error) {
    console.error('Error submitting order:', error);
    res.status(500).json({ error: 'Failed to submit order' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`DevRev backend running on port ${PORT}`));