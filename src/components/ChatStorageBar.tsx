import { useState, useEffect } from 'react';
import { formatBytes } from '@/util/bytes';
import styles from './ChatStorageBar.module.css';

const USAGE_POLL_TIME = 3500;

enum USAGE {
  OK = "OK",
  HIGH = "HIGH",
  FULL = "FULL",
}

export default function ChatStorageBar() {
  const [unknown, setUnknown] = useState(false);
  const [total, setTotal] = useState(100);
  const [used, setUsed] = useState(0);

  useEffect(() => {
    let isLatest = true;

    async function updateEstimate() {
      const quota = await navigator.storage.estimate();
      const totalSpace = quota.quota;
      const usedSpace = quota.usage;
      if (!isLatest) return;

      if (totalSpace && usedSpace) {
        setTotal(totalSpace);
        setUsed(usedSpace);
        setUnknown(false);
      } else {
        setUnknown(true);
      }
      setTimeout(updateEstimate, USAGE_POLL_TIME);
    }
    updateEstimate();

    return () => { isLatest = false };
  }, []);

  function usageClass() {
    const usage = getUsageEnum(used, total);
    switch (usage) {
      case USAGE.FULL: {
        return styles.danger
      }
      case USAGE.HIGH: {
        return styles.warning
      }
      default: {
        return "";
      }
    }
  }

  return (
    <div className={styles["outer-container"]}>
      <div className={styles["inner-container"]}>
        <label htmlFor="chat-storage">
          Chat Storage (IndexedDB)
        </label>
        <progress id="chat-storage"
                  className={`${styles["progress-bar"]} ${usageClass()}`}
                  max={total} value={used}/>
        { progressMsg(used, total) }
        { usageDetails(used, total, unknown) }
      </div>
    </div>
  )
}

function progressMsg(used: number, total: number) {
  const usage = getUsageEnum(used, total);
  switch(usage) {
    case USAGE.FULL: {
      return (
        <p className={`${styles["usage-warning"]} ${styles["full-usage"]}`}>
          {"Storage full!\nSite will function incorrectly! Please delete some chats."}
        </p>
      )
    }
    case USAGE.HIGH: {
      return (
        <p className={`${styles["usage-warning"]} ${styles["high-usage"]}`}>
          {"Warning: High storage usage!"}
        </p>
      )
    }
    default : {
      return null;
    }
  }
}

function usageDetails(used: number, total: number, unknown: boolean) {
  if (unknown) {
    return <p>{"Unknown: ?/?"}</p>
  }
  const totalS = formatBytes(total);
  const usedS = formatBytes(used);

  let usage = used/total * 100;
  usage = Math.ceil(usage * 100);
  const percent = (usage/100).toFixed(2);

  return (
    <p>{`${percent}% - ${usedS}/${totalS}`}</p>
  )
}

function getUsageEnum(used: number, total: number) {
  const usage = used/total;
  if (usage >= 1) {
    return USAGE.FULL;
  } else if (usage > 0.85) {
    return USAGE.HIGH;
  } else {
    return USAGE.OK;
  }
}