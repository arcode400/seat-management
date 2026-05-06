# Test popup konfirmasi user — Seat Management
# Cara pakai: klik kanan file ini → Run with PowerShell
# Atau: powershell -ExecutionPolicy Bypass -File test-popup.ps1

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = "Konfirmasi IT - Seat Management"
$form.Size = New-Object System.Drawing.Size(480, 360)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::White
$form.ControlBox = $false  # Hilangin tombol X di pojok kanan atas
$form.KeyPreview = $true

# Cegah Alt+F4 / Esc supaya user gak bisa skip
$form.Add_KeyDown({
  if ($_.KeyCode -eq "Escape" -or ($_.Alt -and $_.KeyCode -eq "F4")) {
    $_.SuppressKeyPress = $true
    $_.Handled = $true
  }
})

# Cegah close kalau belum submit
$script:submitted = $false
$form.Add_FormClosing({
  if (-not $script:submitted) {
    $_.Cancel = $true
    [System.Windows.Forms.MessageBox]::Show("Anda harus mengisi alasan terlebih dahulu sebelum melanjutkan.", "Konfirmasi Wajib", "OK", "Warning")
  }
})

# Header warning
$lblHeader = New-Object System.Windows.Forms.Label
$lblHeader.Text = "Konfirmasi Diperlukan"
$lblHeader.Font = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$lblHeader.ForeColor = [System.Drawing.Color]::FromArgb(217, 119, 6)
$lblHeader.Location = New-Object System.Drawing.Point(20, 20)
$lblHeader.Size = New-Object System.Drawing.Size(440, 30)
$form.Controls.Add($lblHeader)

# Pesan
$lblMsg = New-Object System.Windows.Forms.Label
$lblMsg.Text = "Anda terdeteksi sudah 9 hari tidak konek ke WiFi kantor.`r`nMohon konfirmasi alasan Anda untuk melanjutkan kerja:"
$lblMsg.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)
$lblMsg.Location = New-Object System.Drawing.Point(20, 55)
$lblMsg.Size = New-Object System.Drawing.Size(440, 40)
$form.Controls.Add($lblMsg)

# Textarea alasan
$txtAlasan = New-Object System.Windows.Forms.TextBox
$txtAlasan.Multiline = $true
$txtAlasan.ScrollBars = "Vertical"
$txtAlasan.Location = New-Object System.Drawing.Point(20, 100)
$txtAlasan.Size = New-Object System.Drawing.Size(440, 130)
$txtAlasan.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$form.Controls.Add($txtAlasan)

# Tombol Submit
$btnSubmit = New-Object System.Windows.Forms.Button
$btnSubmit.Text = "Kirim ke IT"
$btnSubmit.Location = New-Object System.Drawing.Point(330, 250)
$btnSubmit.Size = New-Object System.Drawing.Size(130, 35)
$btnSubmit.BackColor = [System.Drawing.Color]::FromArgb(13, 71, 161)
$btnSubmit.ForeColor = [System.Drawing.Color]::White
$btnSubmit.FlatStyle = "Flat"
$btnSubmit.Font = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
$btnSubmit.Enabled = $false

$btnSubmit.Add_Click({
  if ($txtAlasan.Text.Trim().Length -lt 5) {
    [System.Windows.Forms.MessageBox]::Show("Mohon isi alasan minimal 5 karakter.", "Peringatan", "OK", "Warning")
    return
  }
  Write-Host "ALASAN USER: $($txtAlasan.Text)"
  [System.Windows.Forms.MessageBox]::Show("Terima kasih. Alasan Anda telah dikirim ke IT.", "Berhasil", "OK", "Information")
  $script:submitted = $true
  $form.Close()
})

$txtAlasan.Add_TextChanged({
  $btnSubmit.Enabled = ($txtAlasan.Text.Trim().Length -ge 5)
})

$form.Controls.Add($btnSubmit)

# Footer
$lblFooter = New-Object System.Windows.Forms.Label
$lblFooter.Text = "IT Support Seat Management - Angkasa Pura Supports"
$lblFooter.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$lblFooter.ForeColor = [System.Drawing.Color]::Gray
$lblFooter.Location = New-Object System.Drawing.Point(20, 295)
$lblFooter.Size = New-Object System.Drawing.Size(440, 20)
$form.Controls.Add($lblFooter)

[void]$form.ShowDialog()
