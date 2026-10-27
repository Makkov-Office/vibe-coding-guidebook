// Фикстура: литерал и именованный цвет в стиле — нарушения; якорь ссылки и обычная строка — нет.
export const Bad=()=> <p style={{color:'#123456'}}><a href="#cafe">якорь</a></p>;
export const Named=()=> <p style={{backgroundColor:'white'}} title="red team">текст</p>;
