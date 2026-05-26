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
    public partial class LicenseLogin : Form
    {
        public static api AuthCore = UserLogin.AuthCore;

        public LicenseLogin()
        {
            AuthCore.init();
            InitializeComponent();
        }

        private void LoginBtn_Click(object sender, EventArgs e)
        {
            AuthCore.license(LicenseKey.Text);

            if (AuthCore.response.success)
            {
                Status.Text = "Login successful!";
                Status.ForeColor = Color.Green;

                MainForm main = new MainForm();
                main.Show();
                this.Hide();
            }
            else
            {
                Status.Text = AuthCore.response.message;
                Status.ForeColor = Color.Red;
            }
        }
    }
}
