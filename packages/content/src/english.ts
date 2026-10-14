// Common everyday English words, compiled for sqwer. Lowercase, letters only.
export const ENGLISH_COMMON = `
the be to of and a in that have it for not on with he as you do at this but his by from they we
say her she or an will my one all would there their what so up out if about who get which go me
when make can like time no just him know take people into year your good some could them see
other than then now look only come its over think also back after use two how our work first
well way even new want because any these give day most us is was are been has had were said did
find here thing many help both feel tell ask seem leave call keep turn start show hear play run
move live hold bring happen write sit stand lose pay meet include learn change lead watch follow
stop create speak read spend grow open walk win offer remember love consider appear buy wait
serve die send expect build stay fall cut reach kill remain suggest raise pass sell require
report decide pull home house world life hand part child eye woman place week case point number
group problem fact water room mother area money story month lot right study book job word side
night business issue kind head far black long little own great old big high different small large
next early young important few public bad same able last late hard real best better sure free
true whole clear full special easy strong certain close short simple light open common local
morning city name team idea body door face form level office party power road table voice
window minute paper music class river earth plant animal garden field ocean island color heart
friend family person school letter answer question reason state system program question line
order point course plan view rest market energy space travel light sound picture letter number
quick slow soft warm cold bright quiet happy simple gentle steady careful honest proper rapid
always never often again around below above under between before during without within against
along across behind beyond toward through every each such very much more less still yet already
almost enough quite rather really perhaps maybe though while where whether until since however
`;

/** Unique words from the list above, in their original order. */
export const ENGLISH_WORDS: readonly string[] = Array.from(
	new Set(ENGLISH_COMMON.split(/\s+/).filter(Boolean))
);
