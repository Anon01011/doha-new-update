<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Training Certificate</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
        }

        .certificate-container {
            width: 800px;
            height: 600px;
            margin: 20px auto;
            background-color: #fff;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            position: relative;
            border: 10px solid #ddd;
        }

        .border-inner {
            border: 2px solid #333;
            height: 100%;
            padding: 20px;
            box-sizing: border-box;
            text-align: center;
        }

        .header {
            font-size: 36px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .sub-header {
            font-size: 18px;
            color: #7f8c8d;
            margin-bottom: 40px;
        }

        .recipient {
            font-size: 32px;
            font-weight: bold;
            color: #2980b9;
            margin: 20px 0;
            border-bottom: 1px solid #ccc;
            display: inline-block;
            padding-bottom: 5px;
        }

        .content {
            font-size: 16px;
            color: #34495e;
            line-height: 1.6;
            margin-bottom: 40px;
        }

        .training-title {
            font-weight: bold;
            font-size: 20px;
        }

        .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
        }

        .signature {
            text-align: center;
        }

        .signature-line {
            border-top: 1px solid #333;
            width: 200px;
            margin: 10px auto 0;
        }

        .verification {
            position: absolute;
            bottom: 20px;
            right: 20px;
            font-size: 10px;
            color: #999;
        }

        @media print {
            body {
                background: none;
            }

            .certificate-container {
                margin: 0;
                box-shadow: none;
                border: 5px solid #ddd;
            }
        }
    </style>
</head>

<body>
    <div class="certificate-container">
        <div class="border-inner">
            <div class="header">Certificate of Completion</div>
            <div class="sub-header">This is to certify that</div>

            <div class="recipient">{{ $certificate->employee->name }}</div>

            <div class="content">
                has successfully completed the training program<br><br>
                <span class="training-title">{{ $certificate->training->title }}</span><br><br>
                conducted by {{ $certificate->company->name }}<br>
                on {{ \Carbon\Carbon::parse($certificate->issue_date)->format('F d, Y') }}
            </div>

            <div class="footer">
                <div class="signature">
                    <div class="signature-line"></div>
                    <div>Authorized Signature</div>
                </div>
                <div class="signature">
                    <div class="signature-line"></div>
                    <div>Date</div>
                </div>
            </div>

            <div class="verification">
                Certificate ID: {{ $certificate->certificate_number }} | Verify at:
                {{ route('certificates.verify', $certificate->verification_code) }}
            </div>
        </div>
    </div>
    <script>
        window.onload = function () {
            window.print();
        }
    </script>
</body>

</html>