' Jalankan node monitor.js dari C:\SeatAgent tanpa menampilkan jendela terminal
Set WshShell = CreateObject("WScript.Shell")
' Parameter 0 = jendela tersembunyi, False = tidak perlu tunggu selesai
WshShell.Run "cmd /c cd /d ""C:\SeatAgent"" && node monitor.js", 0, False
