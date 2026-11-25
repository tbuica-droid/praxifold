// Choice answers hold the zero-based option index. Numeric answers use the displayed unit.
/** @typedef {{id:string,path:"use"|"build"|"understand",skill:string,context:string,prompt:string,options?:string[],answer:string,unit?:string,why:string,lesson:string}} PlacementItem */
/** @type {PlacementItem[]} */
export const items = [
  {
    id: "use-source",
    path: "use",
    skill: "Checking a source",
    context:
      "An AI assistant says the library has extended its opening hours. Its only citation is a March newsletter that says, “We’re asking members whether to stay open later.”",
    prompt: "What should you tell someone planning a library visit tonight?",
    options: [
      "The library is open late. The newsletter confirms the change.",
      "The library was considering a change. Let’s check today’s opening hours.",
      "The library kept its old hours. The newsletter only mentions a survey.",
    ],
    answer: "1",
    why: "The newsletter confirms that members were asked. A current schedule or a call to the library can tell the visitor whether the hours actually changed.",
    lesson: "d3",
  },
  {
    id: "use-brief",
    path: "use",
    skill: "Giving clear instructions",
    context:
      "You have six meeting notes and need a handoff before Friday. Your colleague needs to know who agreed to do what. Two notes leave the owner blank.",
    prompt: "Which request would give your colleague a handoff they can check?",
    options: [
      "Write six short summaries. Give each meeting the same amount of space.",
      "List each action and choose the most likely owner from the people who attended.",
      "List each action, its named owner and its meeting date. Flag any missing owner.",
    ],
    answer: "2",
    why: "Your colleague can trace each action to a dated note and follow up on the two missing owners. Guessing a name could put the wrong person in charge.",
    lesson: "d2",
  },
  {
    id: "use-rate",
    path: "use",
    skill: "Checking a percentage",
    context:
      "A team sent 120 survey invitations. Of the 48 people who replied, 12 asked for longer support hours. An AI summary says, “10% of respondents asked for longer hours.”",
    prompt: "What percentage of the people who replied asked for longer hours?",
    unit: "%",
    answer: "25",
    why: "12 of the 48 respondents asked for longer hours. Divide 12 by 48 and multiply by 100 to get 25%. The summary divided by all 120 invitees.",
    lesson: "d4",
  },
  {
    id: "build-process",
    path: "build",
    skill: "Choosing a workflow",
    context:
      "Every Friday, a shop gets the same spreadsheet. It needs to add the units sold for each product, check the totals and save a report. The steps and file format are fixed.",
    prompt:
      "Which setup would make this recurring job easiest to test and repeat?",
    options: [
      "Use a fixed workflow that groups the rows, sums each group and checks the totals.",
      "Give an AI agent the file and let it choose the steps and tools each week.",
      "Ask a chatbot to explain the trends and use its summary as the weekly report.",
    ],
    answer: "0",
    why: "A fixed workflow can apply the same calculation to every file. You can test it with a small spreadsheet whose totals you already know. This job needs no tool-selection decisions from an agent.",
    lesson: "d9",
  },
  {
    id: "build-release",
    path: "build",
    skill: "Protecting private information",
    context:
      "An approved internal AI tool drafts a public newsletter from staff notes. The notes sometimes contain private phone numbers. Your editor must approve the exact text that readers will see.",
    prompt: "When should the workflow require the editor’s approval?",
    options: [
      "After collecting the notes and before the assistant writes the newsletter.",
      "After the final draft is ready and before sending it to subscribers.",
      "After sending a sample to a few subscribers and before sending the rest.",
    ],
    answer: "1",
    why: "At that point the editor can inspect the actual draft and remove private details before anyone receives it. Changing the text after approval should send it back for another check.",
    lesson: "d8",
  },
  {
    id: "build-retrieval",
    path: "build",
    skill: "Selecting an authoritative source",
    context:
      "A staff assistant looks up the current meal allowance. An approved April policy sets it at $22. A June proposal suggests $28. Both files are in the assistant’s search results.",
    prompt:
      "Which rule should the assistant use to answer a question about today’s allowance?",
    options: [
      "Use the newest document in the results and quote the amount it gives.",
      "Include both amounts and use the higher one until the files agree.",
      "Use the approved policy in effect today and cite the file that sets the amount.",
    ],
    answer: "2",
    why: "Retrieval finds relevant documents. The assistant still needs to check which one has authority. The June file proposes a change, so the approved $22 allowance still applies.",
    lesson: "d7",
  },
  {
    id: "model-baseline",
    path: "understand",
    skill: "Comparing with a baseline",
    context:
      "In a test set of 100 messages, 90 are ordinary and 10 are urgent. A model labels 90 messages correctly. A simple rule labels every message “ordinary.”",
    prompt: "What can you tell from the model’s accuracy alone?",
    options: [
      "It ties the simple rule on accuracy. We still need to see which urgent messages it caught.",
      "It catches nine out of ten urgent messages because its overall accuracy is 90%.",
      "It makes exactly the same mistakes as the simple rule because both get 90 right.",
    ],
    answer: "0",
    why: "The rule gets all 90 ordinary messages right and misses all 10 urgent ones. Two systems can tie on overall accuracy while catching different numbers of urgent messages.",
    lesson: "d11",
  },
  {
    id: "model-timing",
    path: "understand",
    skill: "Spotting data leakage",
    context:
      "A bike shop wants to predict a repair’s duration when the bike arrives. Historical records include the bike type, the fault reported at drop-off and the labor charge added when the repair is finished.",
    prompt:
      "Which input would make a test score misleading for a prediction at drop-off?",
    options: [
      "The bike type recorded when the customer arrives.",
      "The labor charge recorded when the repair is finished.",
      "The fault the customer reports when dropping off the bike.",
    ],
    answer: "1",
    why: "The final charge can reveal how long the repair took. Using it gives the model information it will lack at drop-off. This is a form of data leakage.",
    lesson: "d11",
  },
  {
    id: "model-test",
    path: "understand",
    skill: "Testing on new examples",
    context:
      "You add three labeled examples to a prompt that sorts incoming messages. You keep the same model and change only the prompt. A colleague wants to know whether those examples helped.",
    prompt: "How would you check whether the examples helped?",
    options: [
      "Run the new prompt on its three examples and check whether it repeats their labels.",
      "Compare the model’s confidence before and after you added the examples.",
      "Try both prompts on the same fresh messages and compare each result with a checked label.",
    ],
    answer: "2",
    why: "Examples in a prompt give a model context while it answers. This is called few-shot prompting. Using the same fresh messages for both prompts lets you compare errors on work neither prompt used as an example.",
    lesson: "d12",
  },
];
