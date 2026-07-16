import torch
import torch.nn as nn
from torch.nn import functional as F
from Block import Block
from FFN import FFN
from my_embeddings import MyDistilBertEmbeddings


class Distilbert(nn.Module):
    def __init__(
        self,
        hidden_dim,
        vocab_size,
        max_position_embeddings,
        num_heads,
        num_blocks,
        num_labels,
    ):
        super().__init__()
        self.dropout = nn.Dropout(0.1)
        self.embeddings = MyDistilBertEmbeddings(
            vocab_size=vocab_size,
            hidden_dim=hidden_dim,
            max_position_embeddings=max_position_embeddings,
        )
        self.blocks = nn.Sequential(
            *[Block(hidden_dim, num_heads) for _ in range(num_blocks)]
        )
        self.ln_f = nn.LayerNorm(hidden_dim)
        self.classifier = nn.Linear(hidden_dim, num_labels)

    def forward(self, x):
        x = self.embeddings(x)
        x = self.blocks(x)  # Pass through each block (self-attention + FFN)
        x = self.ln_f(x)
        # CLS token vector represents the entire sentence
        pooled_output = x[:, 0]
        pooled_output = self.dropout(pooled_output)
        style_logits = self.classifier(pooled_output)
        return style_logits