from transformers import DistilBertTokenizerFast


def load_tokenizer(model_path: str):
    return DistilBertTokenizerFast.from_pretrained(model_path, local_files_only=True)


def encode_text(tokenizer, text: str, max_len: int = 128):
    out = tokenizer(
        text,
        add_special_tokens=True,  # Adds [CLS]/[SEP] tokens marking start/end of sequence
        truncation=True,
        max_length=max_len,
        padding="max_length",
        return_tensors="pt",  # Return PyTorch tensors
    )
    return {"input_ids": out["input_ids"], "attention_mask": out["attention_mask"]}