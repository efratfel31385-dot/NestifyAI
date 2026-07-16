import torch
from transformers import DistilBertModel
from MyDistilbert import Distilbert

pretrained_model = DistilBertModel.from_pretrained("disilbert", local_files_only=True)

model = Distilbert(
    hidden_dim=768,
    vocab_size=30522,
    max_position_embeddings=512,
    num_heads=12,
    num_blocks=6,
    num_labels=6,
)

pretrained_state = pretrained_model.state_dict()
my_state = model.state_dict()

# Copying the pretrained DistilBERT weights
with torch.no_grad():
    my_state["embeddings.my_Embedding.weight"].copy_(
        pretrained_state["embeddings.word_embeddings.weight"]
    )
    my_state["embeddings.my_position_Embedding.weight"].copy_(
        pretrained_state["embeddings.position_embeddings.weight"]
    )
    my_state["embeddings.LayerNorm.weight"].copy_(
        pretrained_state["embeddings.LayerNorm.weight"]
    )
    my_state["embeddings.LayerNorm.bias"].copy_(
        pretrained_state["embeddings.LayerNorm.bias"]
    )

    for i in range(len(model.blocks)):
        block = model.blocks[i]
        pre_block_prefix = f"transformer.layer.{i}"

        block.ln1.weight.copy_(
            pretrained_state[f"{pre_block_prefix}.sa_layer_norm.weight"]
        )
        block.ln1.bias.copy_(pretrained_state[f"{pre_block_prefix}.sa_layer_norm.bias"])
        block.ln2.weight.copy_(
            pretrained_state[f"{pre_block_prefix}.output_layer_norm.weight"]
        )
        block.ln2.bias.copy_(
            pretrained_state[f"{pre_block_prefix}.output_layer_norm.bias"]
        )
        for h in range(block.sa.num_heads):
            head = block.sa.heads[h]
            start_idx = h * head.head_dim
            end_idx = (h + 1) * head.head_dim

            head.query.weight.copy_(
                pretrained_state[f"{pre_block_prefix}.attention.q_lin.weight"][
                    start_idx:end_idx, :
                ]
            )
            head.key.weight.copy_(
                pretrained_state[f"{pre_block_prefix}.attention.k_lin.weight"][
                    start_idx:end_idx, :
                ]
            )
            head.value.weight.copy_(
                pretrained_state[f"{pre_block_prefix}.attention.v_lin.weight"][
                    start_idx:end_idx, :
                ]
            )

        block.sa.out_.weight.copy_(
            pretrained_state[f"{pre_block_prefix}.attention.out_lin.weight"]
        )
        block.ffn.net[0].weight.copy_(
            pretrained_state[f"{pre_block_prefix}.ffn.lin1.weight"]
        )
        block.ffn.net[0].bias.copy_(
            pretrained_state[f"{pre_block_prefix}.ffn.lin1.bias"]
        )
        block.ffn.net[2].weight.copy_(
            pretrained_state[f"{pre_block_prefix}.ffn.lin2.weight"]
        )
        block.ffn.net[2].bias.copy_(
            pretrained_state[f"{pre_block_prefix}.ffn.lin2.bias"]
        )

model.load_state_dict(my_state, strict=False)
torch.save(model.state_dict(), "my_distilbert_weights.pth")
