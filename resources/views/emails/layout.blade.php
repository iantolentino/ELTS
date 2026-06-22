<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $subject ?? config('app.name') }}</title>
<style>
  body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #18181b; }
  .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  .header { background: #2563eb; padding: 24px 32px; }
  .header h1 { margin: 0; color: #fff; font-size: 20px; font-weight: 600; }
  .header p { margin: 4px 0 0; color: #bfdbfe; font-size: 13px; }
  .body { padding: 32px; }
  .body p { margin: 0 0 16px; line-height: 1.6; font-size: 15px; color: #374151; }
  .ticket-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px 20px; margin: 20px 0; }
  .ticket-box .number { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; }
  .ticket-box .subject { font-size: 16px; font-weight: 600; color: #111827; margin-top: 4px; }
  .meta { font-size: 13px; color: #6b7280; margin-top: 8px; }
  .btn { display: inline-block; margin: 8px 0 0; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; }
  .reply-body { background: #f9fafb; border-left: 3px solid #2563eb; padding: 12px 16px; margin: 16px 0; font-size: 14px; line-height: 1.7; color: #374151; }
  .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
  .footer a { color: #6b7280; text-decoration: none; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>{{ config('app.name') }}</h1>
    <p>Support Ticket System</p>
  </div>
  <div class="body">
    @yield('content')
  </div>
  <div class="footer">
    <p>You received this email because you are associated with a support ticket.<br>
    <a href="{{ config('app.url') }}">{{ config('app.url') }}</a></p>
  </div>
</div>
</body>
</html>
