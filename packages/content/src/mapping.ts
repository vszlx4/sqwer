// Practice words heavy in rare keys (q, z, x, j, k, v, y, p) for the finger mapper.
export const MAPPING_WORDS: readonly string[] = `
quiz quick quiet quite quote equal square queen squeeze unique require question
zone zero size lazy fuzzy dozen frozen amaze puzzle jazz zebra blaze cozy prize
box fix mix six next text extra exact taxi relax index flex wax oxygen complex
job joy jump just join joke major enjoy object adjust injury jacket jelly
kind keep kick knee kettle market basket skill ask park bike knock
very move over even view vivid seven above value valve visit
yes yet yard young yellow eye style sky reply party happy
pick spot happy paper upper pepper simple apple supply proper
`.split(/\s+/).filter(Boolean);
