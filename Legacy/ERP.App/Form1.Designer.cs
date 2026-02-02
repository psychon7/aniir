namespace ERP.App
{
    partial class Form1
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
            this.btn_read_excel = new System.Windows.Forms.Button();
            this.cbx_pty = new System.Windows.Forms.ComboBox();
            this.label1 = new System.Windows.Forms.Label();
            this.btn_set_prd_code = new System.Windows.Forms.Button();
            this.fileSystemWatcher1 = new System.IO.FileSystemWatcher();
            this.btn_chose_file = new System.Windows.Forms.Button();
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.button1 = new System.Windows.Forms.Button();
            this.btn_ecoem_updatename = new System.Windows.Forms.Button();
            this.btn_ecoem_price = new System.Windows.Forms.Button();
            this.btn_ecoem = new System.Windows.Forms.Button();
            this.btn_update_sup_price = new System.Windows.Forms.Button();
            this.btn_choix_file = new System.Windows.Forms.Button();
            this.btn_generate_code = new System.Windows.Forms.Button();
            this.txb_id = new System.Windows.Forms.TextBox();
            this.label2 = new System.Windows.Forms.Label();
            this.txb_key = new System.Windows.Forms.TextBox();
            this.label3 = new System.Windows.Forms.Label();
            this.btn_encrypt = new System.Windows.Forms.Button();
            this.txb_result = new System.Windows.Forms.TextBox();
            this.groupBox2 = new System.Windows.Forms.GroupBox();
            this.rtxb_result = new System.Windows.Forms.RichTextBox();
            this.btn_login_pwd = new System.Windows.Forms.Button();
            this.label5 = new System.Windows.Forms.Label();
            this.txb_pwd = new System.Windows.Forms.TextBox();
            this.label4 = new System.Windows.Forms.Label();
            this.txb_login = new System.Windows.Forms.TextBox();
            this.groupBox3 = new System.Windows.Forms.GroupBox();
            this.rtxb_photo_phrase = new System.Windows.Forms.RichTextBox();
            this.btn_generate_photo_phrase = new System.Windows.Forms.Button();
            this.groupBox4 = new System.Windows.Forms.GroupBox();
            this.btn_create_cat = new System.Windows.Forms.Button();
            this.txb_test_connection = new System.Windows.Forms.TextBox();
            this.btn_test_connection = new System.Windows.Forms.Button();
            this.btn_rename_ies = new System.Windows.Forms.Button();
            this.btn_launch_order = new System.Windows.Forms.Button();
            this.btn_imp_cins = new System.Windows.Forms.Button();
            this.groupBox5 = new System.Windows.Forms.GroupBox();
            this.btn_imp_bl_fa_av = new System.Windows.Forms.Button();
            this.btn_imp_bl = new System.Windows.Forms.Button();
            this.rtxb_cins = new System.Windows.Forms.RichTextBox();
            this.button2 = new System.Windows.Forms.Button();
            ((System.ComponentModel.ISupportInitialize)(this.fileSystemWatcher1)).BeginInit();
            this.groupBox1.SuspendLayout();
            this.groupBox2.SuspendLayout();
            this.groupBox3.SuspendLayout();
            this.groupBox4.SuspendLayout();
            this.groupBox5.SuspendLayout();
            this.SuspendLayout();
            // 
            // btn_read_excel
            // 
            this.btn_read_excel.Location = new System.Drawing.Point(360, 24);
            this.btn_read_excel.Name = "btn_read_excel";
            this.btn_read_excel.Size = new System.Drawing.Size(153, 19);
            this.btn_read_excel.TabIndex = 0;
            this.btn_read_excel.Text = "Read Excel";
            this.btn_read_excel.UseVisualStyleBackColor = true;
            this.btn_read_excel.Click += new System.EventHandler(this.btn_read_excel_Click);
            // 
            // cbx_pty
            // 
            this.cbx_pty.FormattingEnabled = true;
            this.cbx_pty.Location = new System.Drawing.Point(150, 25);
            this.cbx_pty.Name = "cbx_pty";
            this.cbx_pty.Size = new System.Drawing.Size(143, 20);
            this.cbx_pty.TabIndex = 1;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(36, 29);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(113, 12);
            this.label1.TabIndex = 2;
            this.label1.Text = "Chose product type";
            // 
            // btn_set_prd_code
            // 
            this.btn_set_prd_code.Location = new System.Drawing.Point(360, 63);
            this.btn_set_prd_code.Name = "btn_set_prd_code";
            this.btn_set_prd_code.Size = new System.Drawing.Size(153, 21);
            this.btn_set_prd_code.TabIndex = 3;
            this.btn_set_prd_code.Text = "set ProCode";
            this.btn_set_prd_code.UseVisualStyleBackColor = true;
            this.btn_set_prd_code.Click += new System.EventHandler(this.btn_set_prd_code_Click);
            // 
            // fileSystemWatcher1
            // 
            this.fileSystemWatcher1.EnableRaisingEvents = true;
            this.fileSystemWatcher1.SynchronizingObject = this;
            // 
            // btn_chose_file
            // 
            this.btn_chose_file.Location = new System.Drawing.Point(6, 18);
            this.btn_chose_file.Name = "btn_chose_file";
            this.btn_chose_file.Size = new System.Drawing.Size(153, 21);
            this.btn_chose_file.TabIndex = 4;
            this.btn_chose_file.Text = "Chose a file";
            this.btn_chose_file.UseVisualStyleBackColor = true;
            this.btn_chose_file.Click += new System.EventHandler(this.btn_chose_file_Click);
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.button2);
            this.groupBox1.Controls.Add(this.button1);
            this.groupBox1.Controls.Add(this.btn_ecoem_updatename);
            this.groupBox1.Controls.Add(this.btn_ecoem_price);
            this.groupBox1.Controls.Add(this.btn_ecoem);
            this.groupBox1.Controls.Add(this.btn_update_sup_price);
            this.groupBox1.Controls.Add(this.btn_choix_file);
            this.groupBox1.Controls.Add(this.btn_generate_code);
            this.groupBox1.Controls.Add(this.btn_chose_file);
            this.groupBox1.Location = new System.Drawing.Point(39, 115);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(474, 149);
            this.groupBox1.TabIndex = 5;
            this.groupBox1.TabStop = false;
            this.groupBox1.Text = "groupBox1";
            // 
            // button1
            // 
            this.button1.Location = new System.Drawing.Point(175, 18);
            this.button1.Name = "button1";
            this.button1.Size = new System.Drawing.Size(140, 21);
            this.button1.TabIndex = 11;
            this.button1.Text = "ImportProduct_tzx";
            this.button1.UseVisualStyleBackColor = true;
            this.button1.Click += new System.EventHandler(this.button1_Click);
            // 
            // btn_ecoem_updatename
            // 
            this.btn_ecoem_updatename.Location = new System.Drawing.Point(352, 113);
            this.btn_ecoem_updatename.Name = "btn_ecoem_updatename";
            this.btn_ecoem_updatename.Size = new System.Drawing.Size(116, 21);
            this.btn_ecoem_updatename.TabIndex = 10;
            this.btn_ecoem_updatename.Text = "Update Name";
            this.btn_ecoem_updatename.UseVisualStyleBackColor = true;
            this.btn_ecoem_updatename.Click += new System.EventHandler(this.btn_ecoem_updatename_Click);
            // 
            // btn_ecoem_price
            // 
            this.btn_ecoem_price.Location = new System.Drawing.Point(175, 113);
            this.btn_ecoem_price.Name = "btn_ecoem_price";
            this.btn_ecoem_price.Size = new System.Drawing.Size(153, 21);
            this.btn_ecoem_price.TabIndex = 9;
            this.btn_ecoem_price.Text = "Update ECOEM Price";
            this.btn_ecoem_price.UseVisualStyleBackColor = true;
            this.btn_ecoem_price.Click += new System.EventHandler(this.btn_ecoem_price_Click);
            // 
            // btn_ecoem
            // 
            this.btn_ecoem.Location = new System.Drawing.Point(6, 113);
            this.btn_ecoem.Name = "btn_ecoem";
            this.btn_ecoem.Size = new System.Drawing.Size(153, 21);
            this.btn_ecoem.TabIndex = 8;
            this.btn_ecoem.Text = "FOR ECOEM";
            this.btn_ecoem.UseVisualStyleBackColor = true;
            this.btn_ecoem.Click += new System.EventHandler(this.btn_ecoem_Click);
            // 
            // btn_update_sup_price
            // 
            this.btn_update_sup_price.Location = new System.Drawing.Point(321, 69);
            this.btn_update_sup_price.Name = "btn_update_sup_price";
            this.btn_update_sup_price.Size = new System.Drawing.Size(147, 21);
            this.btn_update_sup_price.TabIndex = 7;
            this.btn_update_sup_price.Text = "20180108 UpdateSupPrice";
            this.btn_update_sup_price.UseVisualStyleBackColor = true;
            this.btn_update_sup_price.Click += new System.EventHandler(this.btn_update_sup_price_Click);
            // 
            // btn_choix_file
            // 
            this.btn_choix_file.Location = new System.Drawing.Point(6, 69);
            this.btn_choix_file.Name = "btn_choix_file";
            this.btn_choix_file.Size = new System.Drawing.Size(153, 21);
            this.btn_choix_file.TabIndex = 6;
            this.btn_choix_file.Text = "Chose a file 20171121";
            this.btn_choix_file.UseVisualStyleBackColor = true;
            this.btn_choix_file.Click += new System.EventHandler(this.btn_choix_file_Click);
            // 
            // btn_generate_code
            // 
            this.btn_generate_code.Location = new System.Drawing.Point(321, 18);
            this.btn_generate_code.Name = "btn_generate_code";
            this.btn_generate_code.Size = new System.Drawing.Size(147, 21);
            this.btn_generate_code.TabIndex = 5;
            this.btn_generate_code.Text = "Generate Code for Test";
            this.btn_generate_code.UseVisualStyleBackColor = true;
            this.btn_generate_code.Click += new System.EventHandler(this.btn_generate_code_Click);
            // 
            // txb_id
            // 
            this.txb_id.Location = new System.Drawing.Point(150, 327);
            this.txb_id.Name = "txb_id";
            this.txb_id.Size = new System.Drawing.Size(143, 21);
            this.txb_id.TabIndex = 6;
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(54, 330);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(83, 12);
            this.label2.TabIndex = 7;
            this.label2.Text = "Id to Encrypt";
            // 
            // txb_key
            // 
            this.txb_key.Location = new System.Drawing.Point(150, 370);
            this.txb_key.Name = "txb_key";
            this.txb_key.Size = new System.Drawing.Size(143, 21);
            this.txb_key.TabIndex = 8;
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(57, 376);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(23, 12);
            this.label3.TabIndex = 9;
            this.label3.Text = "Key";
            // 
            // btn_encrypt
            // 
            this.btn_encrypt.Location = new System.Drawing.Point(374, 323);
            this.btn_encrypt.Name = "btn_encrypt";
            this.btn_encrypt.Size = new System.Drawing.Size(139, 21);
            this.btn_encrypt.TabIndex = 10;
            this.btn_encrypt.Text = "Encrypt";
            this.btn_encrypt.UseVisualStyleBackColor = true;
            this.btn_encrypt.Click += new System.EventHandler(this.btn_encrypt_Click);
            // 
            // txb_result
            // 
            this.txb_result.Location = new System.Drawing.Point(374, 369);
            this.txb_result.Name = "txb_result";
            this.txb_result.Size = new System.Drawing.Size(139, 21);
            this.txb_result.TabIndex = 11;
            // 
            // groupBox2
            // 
            this.groupBox2.Controls.Add(this.rtxb_result);
            this.groupBox2.Controls.Add(this.btn_login_pwd);
            this.groupBox2.Controls.Add(this.label5);
            this.groupBox2.Controls.Add(this.txb_pwd);
            this.groupBox2.Controls.Add(this.label4);
            this.groupBox2.Controls.Add(this.txb_login);
            this.groupBox2.Location = new System.Drawing.Point(39, 433);
            this.groupBox2.Name = "groupBox2";
            this.groupBox2.Size = new System.Drawing.Size(474, 186);
            this.groupBox2.TabIndex = 12;
            this.groupBox2.TabStop = false;
            this.groupBox2.Text = "groupBox2";
            // 
            // rtxb_result
            // 
            this.rtxb_result.Location = new System.Drawing.Point(6, 91);
            this.rtxb_result.Name = "rtxb_result";
            this.rtxb_result.Size = new System.Drawing.Size(462, 58);
            this.rtxb_result.TabIndex = 13;
            this.rtxb_result.Text = "";
            // 
            // btn_login_pwd
            // 
            this.btn_login_pwd.Location = new System.Drawing.Point(335, 30);
            this.btn_login_pwd.Name = "btn_login_pwd";
            this.btn_login_pwd.Size = new System.Drawing.Size(133, 21);
            this.btn_login_pwd.TabIndex = 12;
            this.btn_login_pwd.Text = "De(En)crypt";
            this.btn_login_pwd.UseVisualStyleBackColor = true;
            this.btn_login_pwd.Click += new System.EventHandler(this.btn_login_pwd_Click);
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Location = new System.Drawing.Point(15, 54);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(53, 12);
            this.label5.TabIndex = 11;
            this.label5.Text = "Password";
            // 
            // txb_pwd
            // 
            this.txb_pwd.Location = new System.Drawing.Point(111, 52);
            this.txb_pwd.Name = "txb_pwd";
            this.txb_pwd.Size = new System.Drawing.Size(143, 21);
            this.txb_pwd.TabIndex = 10;
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Location = new System.Drawing.Point(15, 30);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(35, 12);
            this.label4.TabIndex = 9;
            this.label4.Text = "Login";
            // 
            // txb_login
            // 
            this.txb_login.Location = new System.Drawing.Point(111, 28);
            this.txb_login.Name = "txb_login";
            this.txb_login.Size = new System.Drawing.Size(143, 21);
            this.txb_login.TabIndex = 8;
            // 
            // groupBox3
            // 
            this.groupBox3.Controls.Add(this.rtxb_photo_phrase);
            this.groupBox3.Controls.Add(this.btn_generate_photo_phrase);
            this.groupBox3.Location = new System.Drawing.Point(588, 29);
            this.groupBox3.Name = "groupBox3";
            this.groupBox3.Size = new System.Drawing.Size(468, 208);
            this.groupBox3.TabIndex = 13;
            this.groupBox3.TabStop = false;
            this.groupBox3.Text = "groupBox3";
            // 
            // rtxb_photo_phrase
            // 
            this.rtxb_photo_phrase.Location = new System.Drawing.Point(6, 44);
            this.rtxb_photo_phrase.Name = "rtxb_photo_phrase";
            this.rtxb_photo_phrase.Size = new System.Drawing.Size(456, 158);
            this.rtxb_photo_phrase.TabIndex = 1;
            this.rtxb_photo_phrase.Text = "";
            // 
            // btn_generate_photo_phrase
            // 
            this.btn_generate_photo_phrase.Location = new System.Drawing.Point(6, 18);
            this.btn_generate_photo_phrase.Name = "btn_generate_photo_phrase";
            this.btn_generate_photo_phrase.Size = new System.Drawing.Size(204, 21);
            this.btn_generate_photo_phrase.TabIndex = 0;
            this.btn_generate_photo_phrase.Text = "Generate insert photo phrase";
            this.btn_generate_photo_phrase.UseVisualStyleBackColor = true;
            this.btn_generate_photo_phrase.Click += new System.EventHandler(this.btn_generate_photo_phrase_Click);
            // 
            // groupBox4
            // 
            this.groupBox4.Controls.Add(this.btn_create_cat);
            this.groupBox4.Controls.Add(this.txb_test_connection);
            this.groupBox4.Controls.Add(this.btn_test_connection);
            this.groupBox4.Location = new System.Drawing.Point(588, 248);
            this.groupBox4.Name = "groupBox4";
            this.groupBox4.Size = new System.Drawing.Size(379, 156);
            this.groupBox4.TabIndex = 14;
            this.groupBox4.TabStop = false;
            this.groupBox4.Text = "Créer catégorie";
            // 
            // btn_create_cat
            // 
            this.btn_create_cat.Location = new System.Drawing.Point(34, 98);
            this.btn_create_cat.Name = "btn_create_cat";
            this.btn_create_cat.Size = new System.Drawing.Size(128, 21);
            this.btn_create_cat.TabIndex = 2;
            this.btn_create_cat.Text = "Créer catégorie";
            this.btn_create_cat.UseVisualStyleBackColor = true;
            this.btn_create_cat.Click += new System.EventHandler(this.btn_create_cat_Click);
            // 
            // txb_test_connection
            // 
            this.txb_test_connection.Location = new System.Drawing.Point(207, 36);
            this.txb_test_connection.Name = "txb_test_connection";
            this.txb_test_connection.Size = new System.Drawing.Size(145, 21);
            this.txb_test_connection.TabIndex = 1;
            // 
            // btn_test_connection
            // 
            this.btn_test_connection.Location = new System.Drawing.Point(34, 34);
            this.btn_test_connection.Name = "btn_test_connection";
            this.btn_test_connection.Size = new System.Drawing.Size(128, 21);
            this.btn_test_connection.TabIndex = 0;
            this.btn_test_connection.Text = "Test connection";
            this.btn_test_connection.UseVisualStyleBackColor = true;
            this.btn_test_connection.Click += new System.EventHandler(this.btn_test_connection_Click);
            // 
            // btn_rename_ies
            // 
            this.btn_rename_ies.Location = new System.Drawing.Point(594, 422);
            this.btn_rename_ies.Name = "btn_rename_ies";
            this.btn_rename_ies.Size = new System.Drawing.Size(146, 21);
            this.btn_rename_ies.TabIndex = 15;
            this.btn_rename_ies.Text = "Rename IES";
            this.btn_rename_ies.UseVisualStyleBackColor = true;
            this.btn_rename_ies.Click += new System.EventHandler(this.btn_rename_ies_Click);
            // 
            // btn_launch_order
            // 
            this.btn_launch_order.Location = new System.Drawing.Point(821, 421);
            this.btn_launch_order.Name = "btn_launch_order";
            this.btn_launch_order.Size = new System.Drawing.Size(146, 23);
            this.btn_launch_order.TabIndex = 16;
            this.btn_launch_order.Text = "Passe commande 新订单";
            this.btn_launch_order.UseVisualStyleBackColor = true;
            this.btn_launch_order.Click += new System.EventHandler(this.btn_launch_order_Click);
            // 
            // btn_imp_cins
            // 
            this.btn_imp_cins.Location = new System.Drawing.Point(6, 20);
            this.btn_imp_cins.Name = "btn_imp_cins";
            this.btn_imp_cins.Size = new System.Drawing.Size(116, 23);
            this.btn_imp_cins.TabIndex = 17;
            this.btn_imp_cins.Text = "导入丢失CIN";
            this.btn_imp_cins.UseVisualStyleBackColor = true;
            this.btn_imp_cins.Click += new System.EventHandler(this.btn_imp_cins_Click);
            // 
            // groupBox5
            // 
            this.groupBox5.Controls.Add(this.btn_imp_bl_fa_av);
            this.groupBox5.Controls.Add(this.btn_imp_bl);
            this.groupBox5.Controls.Add(this.rtxb_cins);
            this.groupBox5.Controls.Add(this.btn_imp_cins);
            this.groupBox5.Location = new System.Drawing.Point(594, 449);
            this.groupBox5.Name = "groupBox5";
            this.groupBox5.Size = new System.Drawing.Size(462, 183);
            this.groupBox5.TabIndex = 18;
            this.groupBox5.TabStop = false;
            this.groupBox5.Text = "丢失的CIN/BL";
            // 
            // btn_imp_bl_fa_av
            // 
            this.btn_imp_bl_fa_av.Location = new System.Drawing.Point(340, 20);
            this.btn_imp_bl_fa_av.Name = "btn_imp_bl_fa_av";
            this.btn_imp_bl_fa_av.Size = new System.Drawing.Size(116, 23);
            this.btn_imp_bl_fa_av.TabIndex = 20;
            this.btn_imp_bl_fa_av.Text = "导入丢失BL,FA,AV";
            this.btn_imp_bl_fa_av.UseVisualStyleBackColor = true;
            this.btn_imp_bl_fa_av.Click += new System.EventHandler(this.btn_imp_bl_fa_av_Click);
            // 
            // btn_imp_bl
            // 
            this.btn_imp_bl.Location = new System.Drawing.Point(177, 20);
            this.btn_imp_bl.Name = "btn_imp_bl";
            this.btn_imp_bl.Size = new System.Drawing.Size(116, 23);
            this.btn_imp_bl.TabIndex = 19;
            this.btn_imp_bl.Text = "导入丢失BL";
            this.btn_imp_bl.UseVisualStyleBackColor = true;
            this.btn_imp_bl.Click += new System.EventHandler(this.btn_imp_bl_Click);
            // 
            // rtxb_cins
            // 
            this.rtxb_cins.Location = new System.Drawing.Point(6, 49);
            this.rtxb_cins.Name = "rtxb_cins";
            this.rtxb_cins.Size = new System.Drawing.Size(450, 128);
            this.rtxb_cins.TabIndex = 18;
            this.rtxb_cins.Text = "";
            // 
            // button2
            // 
            this.button2.Location = new System.Drawing.Point(175, 69);
            this.button2.Name = "button2";
            this.button2.Size = new System.Drawing.Size(140, 21);
            this.button2.TabIndex = 12;
            this.button2.Text = "ImportProduct_20220317";
            this.button2.UseVisualStyleBackColor = true;
            this.button2.Click += new System.EventHandler(this.button2_Click);
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1095, 644);
            this.Controls.Add(this.groupBox5);
            this.Controls.Add(this.btn_launch_order);
            this.Controls.Add(this.btn_rename_ies);
            this.Controls.Add(this.groupBox4);
            this.Controls.Add(this.groupBox3);
            this.Controls.Add(this.groupBox2);
            this.Controls.Add(this.txb_result);
            this.Controls.Add(this.btn_encrypt);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.txb_key);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.txb_id);
            this.Controls.Add(this.groupBox1);
            this.Controls.Add(this.btn_set_prd_code);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.cbx_pty);
            this.Controls.Add(this.btn_read_excel);
            this.Name = "Form1";
            this.Text = "Form1";
            ((System.ComponentModel.ISupportInitialize)(this.fileSystemWatcher1)).EndInit();
            this.groupBox1.ResumeLayout(false);
            this.groupBox2.ResumeLayout(false);
            this.groupBox2.PerformLayout();
            this.groupBox3.ResumeLayout(false);
            this.groupBox4.ResumeLayout(false);
            this.groupBox4.PerformLayout();
            this.groupBox5.ResumeLayout(false);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Button btn_read_excel;
        private System.Windows.Forms.ComboBox cbx_pty;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Button btn_set_prd_code;
        private System.IO.FileSystemWatcher fileSystemWatcher1;
        private System.Windows.Forms.GroupBox groupBox1;
        private System.Windows.Forms.Button btn_chose_file;
        private System.Windows.Forms.TextBox txb_result;
        private System.Windows.Forms.Button btn_encrypt;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.TextBox txb_key;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox txb_id;
        private System.Windows.Forms.Button btn_generate_code;
        private System.Windows.Forms.GroupBox groupBox2;
        private System.Windows.Forms.Button btn_login_pwd;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.TextBox txb_pwd;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.TextBox txb_login;
        private System.Windows.Forms.RichTextBox rtxb_result;
        private System.Windows.Forms.Button btn_choix_file;
        private System.Windows.Forms.GroupBox groupBox3;
        private System.Windows.Forms.RichTextBox rtxb_photo_phrase;
        private System.Windows.Forms.Button btn_generate_photo_phrase;
        private System.Windows.Forms.GroupBox groupBox4;
        private System.Windows.Forms.TextBox txb_test_connection;
        private System.Windows.Forms.Button btn_test_connection;
        private System.Windows.Forms.Button btn_create_cat;
        private System.Windows.Forms.Button btn_update_sup_price;
        private System.Windows.Forms.Button btn_ecoem;
        private System.Windows.Forms.Button btn_ecoem_price;
        private System.Windows.Forms.Button btn_ecoem_updatename;
        private System.Windows.Forms.Button btn_rename_ies;
        private System.Windows.Forms.Button btn_launch_order;
        private System.Windows.Forms.GroupBox groupBox5;
        private System.Windows.Forms.RichTextBox rtxb_cins;
        private System.Windows.Forms.Button btn_imp_cins;
        private System.Windows.Forms.Button btn_imp_bl;
        private System.Windows.Forms.Button btn_imp_bl_fa_av;
        private System.Windows.Forms.Button button1;
        private System.Windows.Forms.Button button2;
    }
}

