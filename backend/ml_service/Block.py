import torch
import torch.nn as nn
from torch.nn import functional as F
from MyMultiHeadSelfAttention import MultiHeadAttention
from FFN import FFN


class Block(nn.Module):
    def __init__(self, n_embd, num_heads):
        super().__init__()
        self.sa = MultiHeadAttention(hidden_dim=n_embd, num_heads=num_heads)
        self.ffn = FFN(n_embd)
        self.ln1 = nn.LayerNorm(n_embd)
        self.ln2 = nn.LayerNorm(n_embd)

    def forward(self, x):
        x = x + self.sa(self.ln1(x))  # Pass through self-attention
        x = x + self.ffn(self.ln2(x))  # Pass through FFN
        return x
