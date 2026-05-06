# Popup konfirmasi user — Seat Management
# Dipanggil dari agent monitor.js dengan parameter:
#   -AlertId <uuid> -LaptopId <uuid> -DaysOutside <int>
#   -SupabaseUrl <url> -SupabaseKey <anon_key>

param(
  [Parameter(Mandatory=$true)][string]$AlertId,
  [Parameter(Mandatory=$true)][string]$LaptopId,
  [Parameter(Mandatory=$true)][int]$DaysOutside,
  [Parameter(Mandatory=$true)][string]$SupabaseUrl,
  [Parameter(Mandatory=$true)][string]$SupabaseKey
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = "Konfirmasi IT - Seat Management"
$form.Size = New-Object System.Drawing.Size(480, 380)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::White
$form.ControlBox = $false
$form.KeyPreview = $true

$form.Add_KeyDown({
  if ($_.KeyCode -eq "Escape" -or ($_.Alt -and $_.KeyCode -eq "F4")) {
    $_.SuppressKeyPress = $true
    $_.Handled = $true
  }
})

$script:submitted = $false
$form.Add_FormClosing({
  if (-not $script:submitted) {
    $_.Cancel = $true
    [System.Windows.Forms.MessageBox]::Show("Anda harus mengisi alasan terlebih dahulu sebelum melanjutkan.", "Konfirmasi Wajib", "OK", "Warning")
  }
})

$lblHeader = New-Object System.Windows.Forms.Label
$lblHeader.Text = "Konfirmasi Diperlukan"
$lblHeader.Font = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$lblHeader.ForeColor = [System.Drawing.Color]::FromArgb(217, 119, 6)
$lblHeader.Location = New-Object System.Drawing.Point(20, 20)
$lblHeader.Size = New-Object System.Drawing.Size(440, 30)
$form.Controls.Add($lblHeader)

$lblMsg = New-Object System.Windows.Forms.Label
$lblMsg.Text = "Sistem mendeteksi laptop ini telah $DaysOutside hari tidak terhubung ke WiFi kantor.`r`nMohon sampaikan keterangan Anda terkait kondisi tersebut. Untuk informasi lebih lanjut, silakan hubungi seat.management@injourneyairports.id."
$lblMsg.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)
$lblMsg.Location = New-Object System.Drawing.Point(20, 55)
$lblMsg.Size = New-Object System.Drawing.Size(440, 70)
$form.Controls.Add($lblMsg)

$txtAlasan = New-Object System.Windows.Forms.TextBox
$txtAlasan.Multiline = $true
$txtAlasan.ScrollBars = "Vertical"
$txtAlasan.Location = New-Object System.Drawing.Point(20, 130)
$txtAlasan.Size = New-Object System.Drawing.Size(440, 110)
$txtAlasan.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$form.Controls.Add($txtAlasan)

$lblStatus = New-Object System.Windows.Forms.Label
$lblStatus.Text = ""
$lblStatus.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$lblStatus.ForeColor = [System.Drawing.Color]::Gray
$lblStatus.Location = New-Object System.Drawing.Point(20, 250)
$lblStatus.Size = New-Object System.Drawing.Size(300, 20)
$form.Controls.Add($lblStatus)

$btnSubmit = New-Object System.Windows.Forms.Button
$btnSubmit.Text = "Kirim Feedback"
$btnSubmit.Location = New-Object System.Drawing.Point(330, 245)
$btnSubmit.Size = New-Object System.Drawing.Size(130, 35)
$btnSubmit.BackColor = [System.Drawing.Color]::FromArgb(13, 71, 161)
$btnSubmit.ForeColor = [System.Drawing.Color]::White
$btnSubmit.FlatStyle = "Flat"
$btnSubmit.Font = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
$btnSubmit.Enabled = $false

$btnSubmit.Add_Click({
  $alasan = $txtAlasan.Text.Trim()
  if ($alasan.Length -lt 5) {
    [System.Windows.Forms.MessageBox]::Show("Mohon isi alasan minimal 5 karakter.", "Peringatan", "OK", "Warning")
    return
  }

  $btnSubmit.Enabled = $false
  $lblStatus.Text = "Mengirim ke server..."
  $form.Refresh()

  try {
    $endpoint = "$SupabaseUrl/rest/v1/rpc/submit_alert_response"
    $body = @{
      p_alert_id  = $AlertId
      p_laptop_id = $LaptopId
      p_alasan    = $alasan
    } | ConvertTo-Json

    $headers = @{
      "apikey"        = $SupabaseKey
      "Authorization" = "Bearer $SupabaseKey"
      "Content-Type"  = "application/json"
      "Prefer"        = "return=minimal"
    }

    Invoke-RestMethod -Uri $endpoint -Method Post -Body $body -Headers $headers -TimeoutSec 15 | Out-Null

    [System.Windows.Forms.MessageBox]::Show("Terima kasih atas feedback Anda.`r`n`r`nKeterangan Anda telah kami terima dan akan ditindaklanjuti oleh tim IT Support.`r`n`r`nApabila ada pertanyaan lebih lanjut, silakan hubungi:`r`nseat.management@injourneyairports.id", "Feedback Terkirim", "OK", "Information")
    $script:submitted = $true
    $form.Close()
  } catch {
    $lblStatus.Text = "Gagal kirim: $($_.Exception.Message)"
    $btnSubmit.Enabled = $true
    [System.Windows.Forms.MessageBox]::Show("Gagal mengirim ke server. Periksa koneksi internet Anda.`r`n`r`nDetail: $($_.Exception.Message)", "Error", "OK", "Error")
  }
})

$txtAlasan.Add_TextChanged({
  $btnSubmit.Enabled = ($txtAlasan.Text.Trim().Length -ge 5)
})

$form.Controls.Add($btnSubmit)

$lblFooter = New-Object System.Windows.Forms.Label
$lblFooter.Text = "IT Support Seat Management  -  Angkasa Pura Supports"
$lblFooter.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$lblFooter.ForeColor = [System.Drawing.Color]::Gray
$lblFooter.Location = New-Object System.Drawing.Point(20, 305)
$lblFooter.Size = New-Object System.Drawing.Size(440, 20)
$lblFooter.TextAlign = "MiddleCenter"
$form.Controls.Add($lblFooter)

[void]$form.ShowDialog()
