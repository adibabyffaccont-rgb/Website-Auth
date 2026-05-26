namespace AdiCheats_Auth___Example
{
    partial class LicenseLogin
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            this.guna2BorderlessForm1 = new Guna.UI2.WinForms.Guna2BorderlessForm(this.components);
            this.Status = new Guna.UI2.WinForms.Guna2HtmlLabel();
            this.guna2BorderlessForm2 = new Guna.UI2.WinForms.Guna2BorderlessForm(this.components);
            this.guna2HtmlLabel1 = new Guna.UI2.WinForms.Guna2HtmlLabel();
            this.LoginBtn = new Guna.UI2.WinForms.Guna2Button();
            this.LicenseKey = new Guna.UI2.WinForms.Guna2TextBox();
            this.SuspendLayout();
            // 
            // guna2BorderlessForm1
            // 
            this.guna2BorderlessForm1.ContainerControl = this;
            this.guna2BorderlessForm1.DockIndicatorTransparencyValue = 0.6D;
            this.guna2BorderlessForm1.TransparentWhileDrag = true;
            // 
            // Status
            // 
            this.Status.BackColor = System.Drawing.Color.Transparent;
            this.Status.ForeColor = System.Drawing.Color.White;
            this.Status.Location = new System.Drawing.Point(37, 379);
            this.Status.Name = "Status";
            this.Status.Size = new System.Drawing.Size(36, 15);
            this.Status.TabIndex = 8;
            this.Status.Text = "Status: ";
            // 
            // guna2BorderlessForm2
            // 
            this.guna2BorderlessForm2.ContainerControl = this;
            this.guna2BorderlessForm2.DockIndicatorTransparencyValue = 0.6D;
            this.guna2BorderlessForm2.TransparentWhileDrag = true;
            // 
            // guna2HtmlLabel1
            // 
            this.guna2HtmlLabel1.BackColor = System.Drawing.Color.Transparent;
            this.guna2HtmlLabel1.Font = new System.Drawing.Font("Microsoft New Tai Lue", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.guna2HtmlLabel1.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(0)))), ((int)(((byte)(192)))), ((int)(((byte)(192)))));
            this.guna2HtmlLabel1.Location = new System.Drawing.Point(128, 30);
            this.guna2HtmlLabel1.Name = "guna2HtmlLabel1";
            this.guna2HtmlLabel1.Size = new System.Drawing.Size(144, 27);
            this.guna2HtmlLabel1.TabIndex = 9;
            this.guna2HtmlLabel1.Text = "Adi Cheats Auth";
            // 
            // LoginBtn
            // 
            this.LoginBtn.DisabledState.BorderColor = System.Drawing.Color.DarkGray;
            this.LoginBtn.DisabledState.CustomBorderColor = System.Drawing.Color.DarkGray;
            this.LoginBtn.DisabledState.FillColor = System.Drawing.Color.FromArgb(((int)(((byte)(169)))), ((int)(((byte)(169)))), ((int)(((byte)(169)))));
            this.LoginBtn.DisabledState.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(141)))), ((int)(((byte)(141)))), ((int)(((byte)(141)))));
            this.LoginBtn.Font = new System.Drawing.Font("Segoe UI", 9F);
            this.LoginBtn.ForeColor = System.Drawing.Color.White;
            this.LoginBtn.Location = new System.Drawing.Point(135, 232);
            this.LoginBtn.Name = "LoginBtn";
            this.LoginBtn.Size = new System.Drawing.Size(143, 44);
            this.LoginBtn.TabIndex = 7;
            this.LoginBtn.Text = "Login";
            this.LoginBtn.Click += new System.EventHandler(this.LoginBtn_Click);
            // 
            // LicenseKey
            // 
            this.LicenseKey.Cursor = System.Windows.Forms.Cursors.IBeam;
            this.LicenseKey.DefaultText = "";
            this.LicenseKey.DisabledState.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(208)))), ((int)(((byte)(208)))), ((int)(((byte)(208)))));
            this.LicenseKey.DisabledState.FillColor = System.Drawing.Color.FromArgb(((int)(((byte)(226)))), ((int)(((byte)(226)))), ((int)(((byte)(226)))));
            this.LicenseKey.DisabledState.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(138)))), ((int)(((byte)(138)))), ((int)(((byte)(138)))));
            this.LicenseKey.DisabledState.PlaceholderForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(138)))), ((int)(((byte)(138)))), ((int)(((byte)(138)))));
            this.LicenseKey.FocusedState.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(94)))), ((int)(((byte)(148)))), ((int)(((byte)(255)))));
            this.LicenseKey.Font = new System.Drawing.Font("Segoe UI", 9F);
            this.LicenseKey.ForeColor = System.Drawing.Color.Gray;
            this.LicenseKey.HoverState.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(94)))), ((int)(((byte)(148)))), ((int)(((byte)(255)))));
            this.LicenseKey.Location = new System.Drawing.Point(93, 136);
            this.LicenseKey.Name = "LicenseKey";
            this.LicenseKey.PlaceholderForeColor = System.Drawing.Color.Gray;
            this.LicenseKey.PlaceholderText = "Enter License Key Here";
            this.LicenseKey.SelectedText = "";
            this.LicenseKey.Size = new System.Drawing.Size(226, 44);
            this.LicenseKey.TabIndex = 5;
            // 
            // LicenseLogin
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.Black;
            this.ClientSize = new System.Drawing.Size(413, 439);
            this.Controls.Add(this.Status);
            this.Controls.Add(this.guna2HtmlLabel1);
            this.Controls.Add(this.LoginBtn);
            this.Controls.Add(this.LicenseKey);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Name = "LicenseLogin";
            this.Text = "LicenseLogin";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private Guna.UI2.WinForms.Guna2BorderlessForm guna2BorderlessForm1;
        private Guna.UI2.WinForms.Guna2HtmlLabel Status;
        private Guna.UI2.WinForms.Guna2HtmlLabel guna2HtmlLabel1;
        private Guna.UI2.WinForms.Guna2Button LoginBtn;
        private Guna.UI2.WinForms.Guna2TextBox LicenseKey;
        private Guna.UI2.WinForms.Guna2BorderlessForm guna2BorderlessForm2;
    }
}