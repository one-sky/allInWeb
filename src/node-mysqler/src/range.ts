enum TYPE {'<>', '=', '<=', '>=', '<', '>', 'like', 'not in' }
interface RANGE {
    lowOption:TYPE,
    low: any,
    highOption: TYPE,
    high: string|number|undefined
}