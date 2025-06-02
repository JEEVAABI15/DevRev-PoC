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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`DevRev backend running on port ${PORT}`));