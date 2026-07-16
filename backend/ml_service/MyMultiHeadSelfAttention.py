import torch
import torch.nn as nn
from torch.nn import functional as F


class Head(nn.Module):
    def __init__(self, hidden_dim=768, num_heads=12):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = hidden_dim // self.num_heads
        self.key = nn.Linear(hidden_dim, self.head_dim, bias=False)
        self.query = nn.Linear(hidden_dim, self.head_dim, bias=False)
        self.value = nn.Linear(hidden_dim, self.head_dim, bias=False)

    def forward(self, x):

        k = self.key(x)  # What this token contains
        q = self.query(x)  # What this token is looking for
        v = self.value(x)  # What to pass forward if attended to
        wei = (q @ k.transpose(-2, -1)) / (
            self.head_dim**0.5
        )  # Attention scores, scaled for stability
        wei = F.softmax(wei, dim=-1)
        out = wei @ v
        return out


class MultiHeadAttention(nn.Module):
    def __init__(self, hidden_dim=768, num_heads=12):
        super().__init__()
        self.num_heads = num_heads
        self.heads = nn.ModuleList(
            [Head(hidden_dim, num_heads) for i in range(num_heads)]
        )
        self.out_ = nn.Linear(hidden_dim, hidden_dim, bias=False)

    def forward(self, x):
        out = torch.cat(
            [head(x) for head in self.heads], dim=-1
        )  # Run all heads in parallel, then concatenate their outputs
        out = self.out_(out)
        return out