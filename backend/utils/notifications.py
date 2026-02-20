
def send_email(to_email: str, subject: str, message: str):
    print(f"[\033[94mMOCK EMAIL\033[0m] To: {to_email} | Subject: {subject} | Body: {message}")
    return True

def send_sms(to_phone: str, message: str):
    print(f"[\033[94mMOCK SMS\033[0m] To: {to_phone} | Message: {message}")
    return True
