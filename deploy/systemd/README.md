# Google Sheets worker on a VM

The application stores every Sheet delivery in PostgreSQL before attempting
the Google API call. `after()` makes a best-effort immediate attempt; this
systemd timer is the durable retry path after traffic drops or the app restarts.

1. In `/etc/thunderforms/thunderforms.env`, set:

   ```sh
   GOOGLE_SHEETS_SYNC_SECRET=the-same-secret-used-by-the-app
   THUNDERFORMS_INTERNAL_URL=http://127.0.0.1:3000
   ```

2. Copy the `.service` and `.timer` files to `/etc/systemd/system/`.
3. Run `sudo systemctl daemon-reload`.
4. Run `sudo systemctl enable --now thunderforms-sheets-sync.timer`.
5. Verify it with `systemctl list-timers thunderforms-sheets-sync.timer` and
   `journalctl -u thunderforms-sheets-sync.service`.

Keep the Next.js server bound to `127.0.0.1`; expose only the HTTPS reverse
proxy publicly. The worker sends the sync secret only to that loopback server.

## Upload protection

Use `../nginx/thunderforms-upload.conf.example` in the VM's Nginx
configuration. It rejects oversized uploads, rate-limits one client to 12
upload starts per minute, caps each client at two concurrent streams, and keeps
Nginx from buffering the whole upload before forwarding it to the Node stream.
