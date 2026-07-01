"use client";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type SuccessAlertOptions = {
  title: string;
  text?: string;
};

/** Green success popup (SweetAlert2). Call after closing any Radix dialog. */
export async function showSuccessAlert({
  title,
  text,
}: SuccessAlertOptions): Promise<void> {
  // Let modal dialog unmount and release focus trap before showing Swal.
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  await Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonText: "OK",
    confirmButtonColor: "#16a34a",
    buttonsStyling: true,
    focusConfirm: true,
    returnFocus: false,
  });
}
