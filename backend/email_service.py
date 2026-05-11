import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.sender_email = os.getenv("SENDER_EMAIL", "noreply@paticare.com")
        self.sender_password = os.getenv("SMTP_PASSWORD", "")
        self.enabled = os.getenv("SMTP_ENABLED", "false").lower() == "true"

    def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send HTML email via SMTP"""
        if not self.enabled:
            print(f"Email devre dışı: {to_email} - {subject}")
            return True

        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = to_email

            # Attach HTML version
            part = MIMEText(html_content, "html")
            message.attach(part)

            # Send via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                if self.sender_password:
                    server.login(self.sender_email, self.sender_password)
                server.send_message(message)

            return True
        except Exception as e:
            print(f"Email gönderme hatası: {str(e)}")
            return False

    def appointment_confirmation_email(
        self,
        customer_name: str,
        customer_email: str,
        veterinarian_name: str,
        clinic_name: str,
        appointment_date: str,
        appointment_time: str,
        pet_name: str,
        service_name: str,
        clinic_address: str,
    ) -> bool:
        """Send appointment confirmation email to customer"""
        subject = "Randevu Onayı - PatiCare"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9fafb; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #0284c7; margin-bottom: 20px;">Randevu Onaylandı ✓</h2>
                    <p>Merhaba <strong>{customer_name}</strong>,</p>
                    <p>Randevunuz başarılı bir şekilde oluşturulmuştur.</p>
                    
                    <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <h3 style="color: #075985; margin-top: 0;">Randevu Detayları</h3>
                        <p><strong>Veteriner:</strong> {veterinarian_name}</p>
                        <p><strong>Klinik:</strong> {clinic_name}</p>
                        <p><strong>Adres:</strong> {clinic_address}</p>
                        <p><strong>Tarih:</strong> {appointment_date}</p>
                        <p><strong>Saat:</strong> {appointment_time}</p>
                        <p><strong>Evcil Hayvan:</strong> {pet_name}</p>
                        <p><strong>Hizmet:</strong> {service_name}</p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        <strong>Not:</strong> Lütfen randevunuzdan 10 dakika önce klinike gelmek üzere hazırlanınız.
                    </p>
                    
                    <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                        <p>Bu otomatik bir mesajdır. Lütfen yanıt vermeyin.</p>
                        <p>© 2026 PatiCare. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        return self.send_email(customer_email, subject, html_content)

    def veterinarian_appointment_notification_email(
        self,
        veterinarian_name: str,
        veterinarian_email: str,
        customer_name: str,
        customer_phone: str,
        pet_name: str,
        pet_species: str,
        appointment_date: str,
        appointment_time: str,
        service_name: str,
    ) -> bool:
        """Send appointment notification email to veterinarian"""
        subject = "Yeni Randevu - PatiCare"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9fafb; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #0284c7; margin-bottom: 20px;">Yeni Randevu Bildirimi</h2>
                    <p>Merhaba <strong>{veterinarian_name}</strong>,</p>
                    <p>Yeni bir randevu oluşturulmuştur. Lütfen detayları aşağıda kontrol edin ve uygunsa onaylayınız.</p>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <h3 style="color: #92400e; margin-top: 0;">Randevu Detayları</h3>
                        <p><strong>Müşteri:</strong> {customer_name}</p>
                        <p><strong>Telefon:</strong> {customer_phone}</p>
                        <p><strong>Evcil Hayvan:</strong> {pet_name} ({pet_species})</p>
                        <p><strong>Tarih:</strong> {appointment_date}</p>
                        <p><strong>Saat:</strong> {appointment_time}</p>
                        <p><strong>Hizmet:</strong> {service_name}</p>
                    </div>
                    
                    <p>Lütfen randevuyu kontrol panelinden onaylayınız.</p>
                    
                    <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                        <p>Bu otomatik bir mesajdır. Lütfen yanıt vermeyin.</p>
                        <p>© 2026 PatiCare. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        return self.send_email(veterinarian_email, subject, html_content)

    def appointment_cancelled_email(
        self,
        customer_name: str,
        customer_email: str,
        veterinarian_name: str,
        clinic_name: str,
        appointment_date: str,
        appointment_time: str,
    ) -> bool:
        """Send appointment cancellation email to customer"""
        subject = "Randevu İptal Edildi - PatiCare"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9fafb; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #dc2626; margin-bottom: 20px;">Randevu İptal Edildi</h2>
                    <p>Merhaba <strong>{customer_name}</strong>,</p>
                    <p>Ne yazık ki aşağıdaki randevunuz iptal edilmiştir:</p>
                    
                    <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <h3 style="color: #7f1d1d; margin-top: 0;">İptal Edilen Randevu</h3>
                        <p><strong>Veteriner:</strong> {veterinarian_name}</p>
                        <p><strong>Klinik:</strong> {clinic_name}</p>
                        <p><strong>Tarih:</strong> {appointment_date}</p>
                        <p><strong>Saat:</strong> {appointment_time}</p>
                    </div>
                    
                    <p>Yeni bir randevu oluşturmak için lütfen platformumuza giriş yaparak seçim yapabilirsiniz.</p>
                    
                    <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                        <p>Bu otomatik bir mesajdır. Lütfen yanıt vermeyin.</p>
                        <p>© 2026 PatiCare. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        return self.send_email(customer_email, subject, html_content)


# Global instance
email_service = EmailService()
