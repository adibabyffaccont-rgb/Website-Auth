using AdiCheats_Auth___Example.Auth;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AdiCheats_Auth___Example
{
    public partial class UserLogin : Form
    {
        public static api AuthCore = new api(
            name: "AdiCheats",                                          // Application name
            apiKey: "gQJSouIpf_vQKYRL9CYqpsoI-0-bmqOP",                // Your API key from dashboard
            apiUrl: "https://http://localhost:5000//api/v1",         // Your auth API URL
            version: "1.0"                                              // App version (must match dashboard)
        );

        public UserLogin()
        {
            InitializeComponent();
            // Do NOT call init() in the constructor — it blocks the UI thread and
            // crashes the app on cold-start timeouts. Init is done async on Load instead.
        }

        private async void UserLogin_Load(object sender, EventArgs e)
        {
            // Show a "connecting" status while init runs in the background
            Status.Text = "Connecting to auth server...";
            Status.ForeColor = Color.Yellow;
            LoginBtn.Enabled = false;

            bool ok = await AuthCore.initAsync();

            LoginBtn.Enabled = true;

            if (ok)
            {
                Status.Text = "Ready. Please log in.";
                Status.ForeColor = Color.LimeGreen;
            }
            else
            {
                // Non-fatal: server may be waking up (Render free tier cold start).
                // The user can still try to log in — loginAsync() will re-attempt init.
                Status.Text = "Server is starting up — try logging in now or in a moment.";
                Status.ForeColor = Color.Orange;
            }
        }

        private async void LoginBtn_Click(object sender, EventArgs e)
        {
            LoginBtn.Enabled = false;
            Status.Text = "Logging in...";
            Status.ForeColor = Color.White;

            await AuthCore.loginAsync(user.Text, pass.Text);

            LoginBtn.Enabled = true;

            if (AuthCore.response.success)
            {
                Status.Text = "Login successful!";
                Status.ForeColor = Color.LimeGreen;

                MainForm main = new MainForm();
                main.Show();
                this.Hide();
            }
            else
            {
                Status.Text = AuthCore.response.message;
                Status.ForeColor = Color.Red;
                MessageBox.Show("Login Failed: " + AuthCore.response.message, "Login Error", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

    }
}
