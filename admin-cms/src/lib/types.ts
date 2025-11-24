// ============================


export type BlockType =
    | "images"
    | "image_set"
    | "basic"
    | "spec_group"
    | "specs_all"
    | "table"
    | "table_group"
    | "list"
    | "content_paragraph"
    | "custom_html";


export type Block = {
    id: number;
    block_type: BlockType;
    sort_order: number;
    config_json?: string | null;
    data: any; // resolved by backend per type
};


// export type ProductDetailsBundle = {
//     product: ProductBasic;
//     categories: CategoryRef[];
//     layout: Layout;
//     blocks: Block[];
//     images?: ImageGroup[]; // optional shortcut if you want
// };


// Action types for callbacks
export type BlockMoveDirection = "up" | "down";