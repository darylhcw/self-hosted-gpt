/*********************************************
 * These functions take the time in ms from Date.now() to perform calcs
 * - Note "dateIsWithinXXX" means date is within the period from now to XX days ago.
 ********************************************/

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function dateIsWithinToday(created: number) {
  const chatDate = new Date(created);
  const now = new Date();

  return chatDate.getDate() === now.getDate()
           && chatDate.getMonth() === now.getMonth()
           && chatDate.getFullYear() === now.getFullYear();
}

function dateIsWithinYesterday(created: number) {
  const yesterday = startOfToday().getTime() - MS_PER_DAY;
  const chatDate = new Date(created).getTime();

  return chatDate >= yesterday;

}

function dateIsWithin7Days(created: number) {
  const sevenDaysAgo = startOfToday().getTime() - MS_PER_DAY*7;
  const chatDate = new Date(created).getTime();

  return chatDate >= sevenDaysAgo;
}

function dateIsWithin30Days(created: number) {
  const thirtyDaysAgo = startOfToday().getTime() - MS_PER_DAY*30;
  const chatDate = new Date(created).getTime();

  return chatDate >= thirtyDaysAgo;
}

function dateIsAfter30Days(created: number) {
  const thirtyDaysAgo = startOfToday().getTime() - MS_PER_DAY*30;
  const chatDate = new Date(created).getTime();

  return chatDate < thirtyDaysAgo;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}


/**
 * Return pair of date string + function that accepts the date.
 * - In desc order from how far the date is.
 * - So we can test one-by-one and pop out the ones that are done.
 */
function dateAndFuncPairs() : {
  date: string,
  dateFunc:(createdAt: number) => boolean
}[] {
  const pairs = [];

  pairs.push({
    date: "Over 30 Days Ago",
    dateFunc: dateIsAfter30Days,
  });
  pairs.push({
    date: "Previous 30 Days",
    dateFunc: dateIsWithin30Days,
  });
  pairs.push({
    date: "Previous 7 Days",
    dateFunc: dateIsWithin7Days,
  });
  pairs.push({
    date: "Yesterday",
    dateFunc: dateIsWithinYesterday,
  });
  pairs.push({
    date: "Today",
    dateFunc: dateIsWithinToday,
  });

  return pairs;
}


export {
  dateAndFuncPairs,
}