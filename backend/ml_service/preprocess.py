import string
import re


def my_split(text: str) -> str:
    # Add spaces around punctuation so it's tokenized separately
    text = re.sub(r"([.,!?;:])", r" \1 ", text)
    # Replace tabs/newlines with a space
    text = re.sub(r"[\r\n\t]+", " ", text)
    # Collapse multiple spaces into one
    text = re.sub(r"\s+", " ", text).strip()
    text = text.lower()
    return text